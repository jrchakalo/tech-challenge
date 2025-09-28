# Análise Inicial

Este documento é o diagnóstico inicial do projeto para o Tech Challenge. A análise a seguir detalha os problemas encontrados na infraestrutura (Docker), no backend e no frontend, abrangendo desde falhas críticas de configuração e segurança até débitos técnicos e oportunidades de melhoria de performance e UX.

Este levantamento servirá como um roteiro para as correções e implementações que serão realizadas.

## 1. Diagnóstico por Componente

### 1.1. Infraestrutura e Ambiente

#### 1.1.1. Execução via Docker
* A execução do comando `docker compose up -d` apresenta problemas. Em ambiente atual, há alto risco de falha tanto no backend quanto no frontend durante o build/execução em containers.
* Causas identificadas (evidências no repositório):
    * **Backend Dockerfile:** utiliza `npm ci --only=production` e em seguida `npm run build`. Como o `typescript` está em devDependencies, o build tende a falhar por falta de dependências de desenvolvimento.
    * **Base URL do frontend no Compose:** `REACT_APP_API_URL` está definido como `http://localhost:3001` (sem o sufixo `/api`), o que causa 404 nas chamadas.

#### 1.1.2. Configuração de Segurança do Docker (`docker-compose.yml`)
*  O arquivo `docker-compose.yml` apresenta práticas de segurança inadequadas, identificadas a partir do README e confirmadas na leitura do código:
    * **Senhas em Texto Plano:** Credenciais do banco de dados estão hardcoded no arquivo.
    * **Ausência de Healthcheck:** O serviço do banco de dados (PostgreSQL) não possui uma verificação de saúde, o que pode levar a condições de corrida onde o backend tenta se conectar antes que o banco esteja pronto.
    * **Ausência de Políticas de Reinicialização:** Os serviços não estão configurados para reiniciar automaticamente em caso de falha.
    * **Configuração do Frontend:** Variável `REACT_APP_API_URL` sem `/api` e volumes de produção podem comprometer o funcionamento do app no Docker.

### 1.2. Backend

#### 1.2.1. Qualidade e Cobertura de Testes
* A execução da suíte de testes (`npm test`) resulta em falhas.
* **Falhas Identificadas em `auth.tests.ts`:**
    * **Teste `should fail - broken test example`:** A asserção falha ao comparar o nome de usuário.
        * **Esperado:** `"wrongusername"`
        * **Recebido:** `"testuser"`
    * **Teste `should fail - broken JWT test`:** A asserção espera `undefined`, mas recebe um token JWT válido.
        * **Esperado:** `undefined`
        * **Recebido:** (Um token JWT)

#### 1.2.2. Vulnerabilidades de Segurança
* Foram identificados pontos de segurança que exigem correção e reforço imediato:
    * **Autenticação via JWT:** Os tokens já possuem expiração (padrão 7d), porém há uso de segredo com fallback fraco. É necessário reforçar o segredo e gerenciá-lo via variáveis.
    * **Validação de Inputs:** Há validação com Joi em diversas rotas (auth, posts create/update, comments create). É necessário completar validações faltantes e validar parâmetros/ids de rota.
    * **Configuração de CORS:** Revisar para origens explícitas e políticas mais restritivas conforme ambiente.

#### 1.2.3. Performance
* O arquivo `postController.ts` contém um padrão de query **N+1**, onde consultas ao banco de dados são realizadas dentro de um loop para buscar dados associados (likes, comentários). Isso degrada severamente a performance e a escalabilidade da listagem de posts.

### 1.3. Frontend

#### 1.3.1. Configuração do Ambiente de Testes
* A suíte de testes (`npm test`) falhava completamente devido a erros de configuração. Para viabilizar a execução dos testes, foi necessário:
    1.  Renomear `useAuth.ts` para `useAuth.tsx` devido à presença de código JSX;
    2.  Realizar o downgrade da biblioteca `axios` para uma versão compatível com o ambiente Jest;
    3.  Desenvolver um `test-utils.tsx` para encapsular os componentes em providers necessários (`ThemeProvider`, `MemoryRouter`, `AuthProvider`), que estavam ausentes no escopo dos testes;
    4.  Mover os providers globais de `App.tsx` para `index.tsx` para isolar o componente `App` e torná-lo testável;
    5.  Corrigir o formato de dados na propriedade `breakpoints` do tema;

#### 1.3.2. Execução Manual e Compilação
* A execução de `npm start` falha com múltiplos erros de compilação TypeScript.
* **Causa Raiz:** A necessidade de aprimorar a tipagem do tema do `styled-components` e a divergência de `breakpoints` (tema vs uso) afetam a responsividade (CSS).

#### 1.3.3. Testes Funcionais
* Após as correções de ambiente, a suíte de testes roda, mas os dois testes falham.
* **Falhas Identificadas em `App.test.tsx`:**
    * **Teste `renders learn react link`:** A asserção busca pelo texto "learn react", que não existe no componente `<App />`.
    * **Teste `should fail - broken test for evaluation`:** A asserção busca pelo texto "this text does not exist", que propositalmente não está no DOM.

#### 1.3.4. Interface e Experiência do Usuário (UI/UX)
* Foram apontadas deficiências que precisam ser verificadas e corrigidas após a aplicação estar funcional.
    * **Responsividade:** Componentes podem não se adaptar corretamente a diferentes tamanhos de tela.
    * **Estados de Interação:** Faltam `hover states` em elementos clicáveis.
    * **Feedback de Formulários:** Ausência de feedback claro para o usuário em caso de erros de validação ou sucesso na submissão.

## 2. Plano de Ação

Com base no diagnóstico, a seguinte lista de tarefas foi criada e priorizada para guiar o desenvolvimento deste desafio.

| Categoria     | Tarefa                                                | Prioridade (1-5, 5=máx) |
| :------------ | :---------------------------------------------------- | :---------------------- |
| **Crítico** | Corrigir erros de compilação no Frontend (tipagem do tema, configuração dos providers globais, QueryClientProvider, plugins Tailwind referenciados no config) | 5 |
| **Crítico** | Corrigir configuração do Docker (Dockerfile backend para build TS com devDeps, evitar volumes que sobrescrevem build/dist, corrigir REACT_APP_API_URL com `/api`, Senhas, Healthcheck) | 5 |
| **Crítico** | Revisar política de hashing e fluxo de alteração de senha (bcrypt) | 5 |
| **Crítico** | Fortalecer segurança do JWT (remover fallback fraco, gerenciar segredo via Secrets/ENV; expiração já configurada) | 5 |
| **Crítico** | Corrigir asserções nos testes de Backend e Frontend      | 5                       |
| **Performance** | Resolver query N+1 no `postController` com Eager Loading e no `getCommentsWithAuthors` (referência: `docs/EAGER_LOADING.md`) | 5 |
| **Segurança** | Completar validação de inputs (Joi) para rotas faltantes (ex.: `updateProfile`) e validar params/ids | 4 |
| **Segurança** | Configurar CORS de forma restritiva                 | 3                       |
| **DX/Refatoração** | Adicionar políticas de `restart` e healthchecks no Docker Compose; considerar `depends_on` com condição de saúde | 3 |
| **DX/Refatoração** | Separar `docker-compose` de desenvolvimento e produção para evitar sobrescritas de artefatos | 3 |
| **UI/UX** | Implementar feedback visual em formulários            | 2                       |
| **UI/UX** | Adicionar `hover states` em elementos interativos       | 2                       |
| **UI/UX** | Revisar e corrigir responsividade da aplicação (ajustar `breakpoints` do tema vs uso no `Container`) | 3 |

---

# Correções Executadas

## 1. Estabilização do Ambiente Frontend

Esta seção detalha a primeira onda de correções, focada em resolver os erros críticos de compilação e estabilizar o ambiente de desenvolvimento do frontend.

* Ajustei o tema tipado do `styled-components` com `styled.d.ts`, eliminando os erros de tipagem no acesso às cores, espaçamentos e raios compartilhados.
* Reescrevi o `Header`, `Footer` e a tela de login para usarem componentes locais com estilos declarativos, removendo dependências quebradas do antigo kit (`components/ui`).
* Refatorei os componentes de formulário para utilizar apenas `styled-components`, mantendo o visual esperado sem herdar comportamentos não tipados.
* Corrigi o fluxo de hooks avançados de posts (`usePostsAdvanced`) para alinhar as mutações com o contrato real das APIs, evitar estouro de `undefined` em contadores e remover referências a permissões inexistentes no tipo `User`.
* Atualizei o `postService` e o interceptor de `api.ts` para aceitar filtros de array/boolean e evitar acessos a headers indefinidos.
* Reinstalei as dependências do frontend (com os plugins Tailwind utilizados) e validei com `npm run build`, que agora compila com sucesso.

---

## 2. Configurações do Docker

Esta seção detalha as correções referentes à otimização do ambiente Docker. O Dockerfile original foi refatorado para resultar em uma imagem de produção mais segura e eficiente.

* Refatorei o `backend/Dockerfile` para um build multi-stage, para instalar dependências de dev antes de compilar e entrega imagem enxuta para produção.
* Ajustei o `docker-compose.yml` para evitar volumes que sobrescrevem o build, retirei as senhas em texto plano, adicionei healthchecks, políticas de restart e corrigi a URL do frontend para `http://backend:3001/api`. Teste: `JWT_SECRET=test docker compose config` retornou a composição saudável.
* Criei `.env` e `.env.example` na raiz do projeto para as variáveis de ambiente.

---

## 3. Hashing e fluxo de alteração de senha

* Parametrizei o número de rounds do bcrypt em `backend/src/config/security.ts`, expondo `BCRYPT_SALT_ROUNDS` com fallback seguro e atualizando o model `User` para usar essa configuração. Teste: `npm test -- --testNamePattern="should create a new user successfully"` passou validando que o hash continua funcionando.
* Acrescentei o fluxo protegido de troca de senha (`POST /auth/change-password`) com validações Joi para senha forte e confirmação, além do tratamento de erros para senhas iguais ou incorretas. Teste: `npm test -- --testNamePattern="should update the password when current password is valid"` confirmou a atualização com hash novo.
* Ampliei a suíte com cenários negativos integrados, garantindo respostas 400 tanto para senha atual inválida quanto para confirmação divergente ao chamar `/auth/change-password`.
* Estruturei recuperação de senha segura com tokens temporários (rotas `/auth/forgot-password` e `/auth/reset-password`), armazenando hash + expiração configurável e cobrindo fluxos felizes/negativos via Supertest.

## 4. Fortalecer segurança do JWT

* Centralizei a configuração de tokens exigindo segredos fortes distintos para acesso e refresh, removendo fallbacks inseguros..
* Bloqueei o uso de segredos idênticos entre acesso e refresh, forçando diferenciação já no boot da aplicação para mitigar reutilização indevida.
* Criei o arquivo `env.ts` para facilitar a exeução

---

## 5. Correções de Testes Backend

* Reescrevi asserções artificiais do `auth.test.ts` para validar serialização segura de usuários e garantir a verificação de tokens com `verifyToken`.

---

## 6. Correções de Testes Frontend

* Ajustei `test-utils.tsx` para permitir rotas controladas, filtrei a prop `hasError` nos inputs estilizados e reescrevi `App.test.tsx` validando a tela de login real e o link de cadastro.

---

## 7. Performance no Feed de Posts

* Reescrevi o `getPosts` para carregar autores, comentários e contagens em uma única consulta via `findAll` com `include` e agregações `COUNT`, eliminando os laços que disparavam queries adicionais por post.
* Ajustei `getPostById` para carregar comentários e seus autores em eager loading, mantendo as contagens de likes em SQL e serializando a resposta em um único payload.
* Removi o helper `Post.getCommentsWithAuthors`, que permanecia como exemplo quebrado.

---

## 8. Validação de Inputs com Joi

* Expandi o middleware de validação para aceitar corpo, params e query com saneamento automático, evitando retrabalho manual em controllers.
* Adicionei validações de `id` e `postId` nas rotas de posts e comentários, bloqueando acessos com parâmetros inválidos antes de chegar na camada de negócio.
* Criei schemas dedicados para atualização de comentários e de perfil, garantindo que somente campos permitidos sejam aceitos e que haja ao menos um dado para atualizar.
* Reforcei o schema de `updatePost` para impedir requisições vazias, mantendo o fluxo previsível na API.

---

## 9. CORS Restritivo

* Centralizei a configuração de CORS em `config/cors.ts`, validando a lista de origens permitidas a partir de `CORS_ALLOWED_ORIGINS` e descartando URLs malformadas com um aviso.
* Atualizei o Express para usar essa configuração compartilhada, liberando apenas métodos, cabeçalhos e origens necessários para o frontend.
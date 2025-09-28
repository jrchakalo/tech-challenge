## Docker Secrets

Este diretório disponibiliza **apenas exemplos** dos arquivos de segredo utilizados pelo `docker-compose.yml`.

### Como preparar os segredos reais

1. Copie os exemplos removendo a extensão `.example`:
   ```bash
   cp secrets/db_password.txt.example secrets/db_password.txt
   cp secrets/jwt_secret.txt.example secrets/jwt_secret.txt
   cp secrets/jwt_refresh_secret.txt.example secrets/jwt_refresh_secret.txt
   ```
2. Edite cada arquivo e substitua o conteúdo por um valor forte e único.
3. Se quiser armazenar os segredos em outro local, defina as variáveis de ambiente antes de rodar o Compose:
   - `DOCKER_SECRET_DB_PASSWORD_FILE`
   - `DOCKER_SECRET_JWT_SECRET_FILE`
   - `DOCKER_SECRET_JWT_REFRESH_SECRET_FILE`

O `docker-compose.yml` usará automaticamente os arquivos apontados pelas variáveis; caso não estejam definidas, utilizará os arquivos do diretório `secrets/`.

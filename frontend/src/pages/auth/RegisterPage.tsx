import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import styled from 'styled-components';
import { toast } from 'react-toastify';

import { Form, FormGroup, FormStatus, Input, Label, ErrorText, Spinner } from '../../components/forms';
import { useAuth } from '../../hooks/useAuth';
import { RegisterRequest } from '../../types';

const PageContainer = styled.section`
  min-height: calc(100vh - 160px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 16px;
`;

const Card = styled.div`
  width: 100%;
  max-width: 440px;
  background-color: #ffffff;
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: 32px;
  box-shadow: ${({ theme }) => theme.shadows.md};
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const Title = styled.h1`
  margin: 0;
  text-align: center;
  font-size: ${({ theme }) => theme.fontSizes['2xl']};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: ${({ theme }) => theme.colors.gray[900]};
`;

const Subtitle = styled.p`
  margin: 0;
  text-align: center;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.gray[600]};
`;

const SubmitButton = styled.button<{ $isLoading?: boolean }>`
  width: 100%;
  padding: 12px 16px;
  border-radius: ${({ theme }) => theme.radii.md};
  border: none;
  background-color: ${({ theme }) => theme.colors.primary[600]};
  color: #ffffff;
  font-size: ${({ theme }) => theme.fontSizes.base};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.space[2]};
  cursor: ${({ $isLoading }) => ($isLoading ? 'not-allowed' : 'pointer')};
  opacity: ${({ $isLoading }) => ($isLoading ? 0.7 : 1)};
  transition: background-color 0.2s ease-in-out, opacity 0.2s ease-in-out;

  &:hover {
    background-color: ${({ theme, $isLoading }) =>
      $isLoading ? theme.colors.primary[600] : theme.colors.primary[700]};
  }
`;

const FooterText = styled.p`
  text-align: center;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.gray[600]};

  a {
    color: ${({ theme }) => theme.colors.primary[600]};
    font-weight: ${({ theme }) => theme.fontWeights.medium};
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
`;

interface RegisterFormValues extends RegisterRequest {
  confirmPassword: string;
}

export const RegisterPage: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    defaultValues: {
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      firstName: '',
      lastName: '',
    },
  });

  const passwordValue = watch('password');

  const onSubmit = async (values: RegisterFormValues) => {
    setStatus(null);
    setIsSubmitting(true);

    try {
      const { confirmPassword, ...userData } = values;
      await registerUser(userData);
      setStatus({ type: 'success', message: 'Conta criada com carinho! Preparando o redirecionamento...' });
      toast.success('Cadastro realizado com sucesso!');
      navigate('/');
    } catch (error: any) {
      const message = error?.response?.data?.error ?? 'Não foi possível concluir o cadastro agora. Tente novamente em instantes.';
      setStatus({ type: 'error', message });
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageContainer>
      <Card>
        <div>
          <Title>Crie sua conta</Title>
          <Subtitle>Preencha os dados abaixo para começar a compartilhar suas histórias.</Subtitle>
        </div>

        {status && (
          <FormStatus $variant={status.type} role={status.type === 'error' ? 'alert' : 'status'}>
            {status.message}
          </FormStatus>
        )}

        <Form onSubmit={handleSubmit(onSubmit)} noValidate>
          <FormGroup>
            <Label htmlFor="firstName">Nome</Label>
            <Input
              id="firstName"
              type="text"
              placeholder="Como prefere ser chamado"
              {...register('firstName', {
                maxLength: {
                  value: 50,
                  message: 'Use no máximo 50 caracteres',
                },
              })}
            />
            {errors.firstName && <ErrorText>{errors.firstName.message}</ErrorText>}
          </FormGroup>

          <FormGroup>
            <Label htmlFor="lastName">Sobrenome</Label>
            <Input
              id="lastName"
              type="text"
              placeholder="Sobrenome (opcional)"
              {...register('lastName', {
                maxLength: {
                  value: 50,
                  message: 'Use no máximo 50 caracteres',
                },
              })}
            />
            {errors.lastName && <ErrorText>{errors.lastName.message}</ErrorText>}
          </FormGroup>

          <FormGroup>
            <Label htmlFor="username">Nome de usuário</Label>
            <Input
              id="username"
              type="text"
              placeholder="Escolha um identificador único"
              hasError={!!errors.username}
              aria-invalid={!!errors.username}
              aria-describedby={errors.username ? 'username-error' : undefined}
              {...register('username', {
                required: 'O nome de usuário é obrigatório',
                minLength: {
                  value: 3,
                  message: 'Use pelo menos 3 caracteres',
                },
                maxLength: {
                  value: 24,
                  message: 'Use no máximo 24 caracteres',
                },
                pattern: {
                  value: /^[a-zA-Z0-9._-]+$/,
                  message: 'Use apenas letras, números e pontos',
                },
              })}
            />
            {errors.username && (
              <ErrorText id="username-error">{errors.username.message}</ErrorText>
            )}
          </FormGroup>

          <FormGroup>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Seu melhor email"
              hasError={!!errors.email}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'email-error' : undefined}
              {...register('email', {
                required: 'O email é obrigatório',
                pattern: {
                  value: /^\S+@\S+\.\S+$/,
                  message: 'Digite um email válido',
                },
              })}
            />
            {errors.email && <ErrorText id="email-error">{errors.email.message}</ErrorText>}
          </FormGroup>

          <FormGroup>
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              placeholder="Crie uma senha segura"
              hasError={!!errors.password}
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? 'password-error' : undefined}
              {...register('password', {
                required: 'A senha é obrigatória',
                minLength: {
                  value: 6,
                  message: 'Use pelo menos 6 caracteres',
                },
              })}
            />
            {errors.password && <ErrorText id="password-error">{errors.password.message}</ErrorText>}
          </FormGroup>

          <FormGroup>
            <Label htmlFor="confirmPassword">Confirme a senha</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Repita a senha"
              hasError={!!errors.confirmPassword}
              aria-invalid={!!errors.confirmPassword}
              aria-describedby={errors.confirmPassword ? 'confirmPassword-error' : undefined}
              {...register('confirmPassword', {
                required: 'Confirme sua senha',
                validate: (value) =>
                  value === passwordValue || 'As senhas precisam combinar certinho.', // Comentário: esse recadinho evita que alguém cadastre a senha errada sem querer.
              })}
            />
            {errors.confirmPassword && (
              <ErrorText id="confirmPassword-error">{errors.confirmPassword.message}</ErrorText>
            )}
          </FormGroup>

          <SubmitButton type="submit" disabled={isSubmitting} $isLoading={isSubmitting}>
            {isSubmitting && <Spinner aria-hidden="true" />}
            {isSubmitting ? 'Enviando...' : 'Criar conta'}
          </SubmitButton>
        </Form>

        <FooterText>
          Já tem uma conta?{' '}
          <Link to="/login">Entre por aqui</Link>
        </FooterText>
      </Card>
    </PageContainer>
  );
};

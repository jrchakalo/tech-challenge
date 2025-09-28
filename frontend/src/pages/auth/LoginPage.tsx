import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Form, FormGroup, Label, Input, ErrorText, FormStatus, Spinner } from '../../components/forms';
import { useAuth } from '../../hooks/useAuth';
import { LoginRequest } from '../../types';
import { toast } from 'react-toastify';
import styled from 'styled-components';

const PageContainer = styled.section`
  min-height: calc(100vh - 160px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 16px;
`;

const Card = styled.div`
  width: 100%;
  max-width: 400px;
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

export const LoginPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const { login } = useAuth();
  const navigate = useNavigate();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginRequest>();

  const onSubmit = async (data: LoginRequest) => {
    setStatus(null);
    setIsLoading(true);
    try {
      await login(data.email, data.password);
      setStatus({ type: 'success', message: 'Login realizado com sucesso. Redirecionando...' });
      toast.success('Logged in successfully!');
      navigate('/');
    } catch (error: any) {
      const message = error.response?.data?.error || 'Não foi possível entrar, tente novamente com outras credenciais.';
      setStatus({ type: 'error', message });
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageContainer>
      <Card>
        <Title>Welcome Back</Title>

        {status && (
          <FormStatus $variant={status.type} role={status.type === 'error' ? 'alert' : 'status'}>
            {status.message}
          </FormStatus>
        )}
        
        <Form onSubmit={handleSubmit(onSubmit)} noValidate>
          <FormGroup>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              hasError={!!errors.email}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'email-error' : undefined}
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^\S+@\S+$/i,
                  message: 'Invalid email address',
                },
              })}
            />
            {errors.email && <ErrorText id="email-error">{errors.email.message}</ErrorText>}
          </FormGroup>
          
          <FormGroup>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              hasError={!!errors.password}
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? 'password-error' : undefined}
              {...register('password', {
                required: 'Password is required',
                minLength: {
                  value: 6,
                  message: 'Password must be at least 6 characters',
                },
              })}
            />
            {errors.password && <ErrorText id="password-error">{errors.password.message}</ErrorText>}
          </FormGroup>
          
          <SubmitButton type="submit" disabled={isLoading} $isLoading={isLoading}>
            {isLoading && <Spinner aria-hidden="true" />}
            {isLoading ? 'Signing in...' : 'Sign In'}
          </SubmitButton>
        </Form>
        
        <FooterText>
          Don't have an account?{' '}
          <Link to="/register">
            Sign up here
          </Link>
        </FooterText>
      </Card>
    </PageContainer>
  );
};
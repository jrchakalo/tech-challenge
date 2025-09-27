import React from 'react';
import { render, screen } from './test-utils';
import App from './App';

test('exibe a tela de login para visitantes', async () => {
  render(<App />, { route: '/login' });

  const title = await screen.findByRole('heading', { name: /welcome back/i });
  expect(title).toBeInTheDocument();

  const submitButton = screen.getByRole('button', { name: /sign in/i });
  expect(submitButton).toBeInTheDocument();
});

test('mostra link para cadastro a partir do login', async () => {
  render(<App />, { route: '/login' });

  await screen.findByRole('heading', { name: /welcome back/i });
  const registerLink = screen.getByRole('link', { name: /sign up here/i });
  expect(registerLink).toHaveAttribute('href', '/register');
});
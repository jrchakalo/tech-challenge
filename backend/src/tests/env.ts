// Mantemos segredos determinísticos nos testes para facilitar asserts.
process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'segredo-testes-acesso-1234567890';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET ?? 'segredo-testes-refresh-0987654321';
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? '1h';
process.env.JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN ?? '30d';

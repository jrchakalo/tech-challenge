import fs from 'fs';

const DEFAULT_SALT_ROUNDS = 12;
const DEFAULT_RESET_TOKEN_EXPIRATION_MINUTES = 30;
const MIN_JWT_SECRET_LENGTH = 32;
const DEFAULT_JWT_EXPIRES_IN = '7d';
const DEFAULT_REFRESH_EXPIRES_IN = '30d';

const readSecretFile = (filePath?: string): string | undefined => {
  if (!filePath) {
    return undefined;
  }

  try {
    const content = fs.readFileSync(filePath, 'utf-8').trim();
    return content.length > 0 ? content : undefined;
  } catch (error) {
    console.warn(`⚠️  Não foi possível ler o arquivo de segredo em ${filePath}:`, error);
    return undefined;
  }
};

const parseSaltRounds = (value: string | undefined): number => {
  if (!value) {
    return DEFAULT_SALT_ROUNDS;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 10 || parsed > 15) {
    return DEFAULT_SALT_ROUNDS;
  }

  return parsed;
};

const parseResetExpiration = (value: string | undefined): number => {
  if (!value) {
    return DEFAULT_RESET_TOKEN_EXPIRATION_MINUTES;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 5 || parsed > 120) {
    return DEFAULT_RESET_TOKEN_EXPIRATION_MINUTES;
  }

  return parsed;
};

export const BCRYPT_SALT_ROUNDS = parseSaltRounds(process.env.BCRYPT_SALT_ROUNDS);
export const PASSWORD_RESET_TOKEN_EXPIRATION_MINUTES = parseResetExpiration(
  process.env.PASSWORD_RESET_TOKEN_EXPIRATION_MINUTES
);

const ensureSecret = (value: string | undefined, envName: string): string => {
  if (!value) {
    throw new Error(`Variável ${envName} não configurada. Defina um segredo forte para proteger os tokens.`);
  }

  const secret = value.trim();
  if (secret.length < MIN_JWT_SECRET_LENGTH) {
    throw new Error(`Valor em ${envName} deve possuir ao menos ${MIN_JWT_SECRET_LENGTH} caracteres.`);
  }

  return secret;
};

const sanitizeExpiration = (value: string | undefined, fallback: string): string => {
  if (!value || !value.trim()) {
    return fallback;
  }

  return value.trim();
};

const rawAccessSecret = readSecretFile(process.env.JWT_SECRET_FILE) ?? process.env.JWT_SECRET;
const rawRefreshSecret = readSecretFile(process.env.JWT_REFRESH_SECRET_FILE) ?? process.env.JWT_REFRESH_SECRET;

const resolvedAccessSecret = ensureSecret(rawAccessSecret, 'JWT_SECRET/JWT_SECRET_FILE');
const resolvedRefreshSecret = ensureSecret(rawRefreshSecret, 'JWT_REFRESH_SECRET/JWT_REFRESH_SECRET_FILE');

if (resolvedAccessSecret === resolvedRefreshSecret) {
  throw new Error('As variáveis JWT_SECRET e JWT_REFRESH_SECRET devem ser diferentes para reduzir riscos de vazamento.');
}

export const JWT_SECRET = resolvedAccessSecret;
export const JWT_REFRESH_SECRET = resolvedRefreshSecret;
export const JWT_EXPIRES_IN = sanitizeExpiration(process.env.JWT_EXPIRES_IN, DEFAULT_JWT_EXPIRES_IN);
export const JWT_REFRESH_EXPIRES_IN = sanitizeExpiration(
  process.env.JWT_REFRESH_EXPIRES_IN,
  DEFAULT_REFRESH_EXPIRES_IN
);

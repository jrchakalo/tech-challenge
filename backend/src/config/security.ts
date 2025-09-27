const DEFAULT_SALT_ROUNDS = 12;
const DEFAULT_RESET_TOKEN_EXPIRATION_MINUTES = 30;

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

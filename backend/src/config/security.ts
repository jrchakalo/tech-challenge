const DEFAULT_SALT_ROUNDS = 12;

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

export const BCRYPT_SALT_ROUNDS = parseSaltRounds(process.env.BCRYPT_SALT_ROUNDS);

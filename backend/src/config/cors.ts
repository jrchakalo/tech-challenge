import { CorsOptions } from 'cors';

const DEFAULT_ALLOWED_ORIGINS = ['http://localhost:3000'];
const DEFAULT_ALLOWED_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'];
const DEFAULT_ALLOWED_HEADERS = ['Content-Type', 'Authorization', 'X-Requested-With'];
const DEFAULT_EXPOSED_HEADERS = ['Content-Disposition'];

const sanitizeOrigins = (value: string | undefined): string[] => {
  if (!value) {
    return DEFAULT_ALLOWED_ORIGINS;
  }

  const parsed = value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .filter((item) => {
      try {
        new URL(item);
        return true;
      } catch (error) {
        console.warn(`🚨 Origem ignorada por formato inválido: ${item}`);
        return false;
      }
    });

  return parsed.length > 0 ? parsed : DEFAULT_ALLOWED_ORIGINS;
};

export const allowedOrigins = sanitizeOrigins(process.env.CORS_ALLOWED_ORIGINS);

export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    if (!origin) {
      callback(null, true);
      return;
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error('Origem não autorizada pelo CORS.'));
  },
  credentials: true,
  methods: DEFAULT_ALLOWED_METHODS,
  allowedHeaders: DEFAULT_ALLOWED_HEADERS,
  exposedHeaders: DEFAULT_EXPOSED_HEADERS,
  maxAge: 600,
};

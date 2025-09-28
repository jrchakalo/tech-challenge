import fs from 'fs';
import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

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

const dbPassword = readSecretFile(process.env.DB_PASSWORD_FILE) || process.env.DB_PASSWORD || 'password123';

const isTestEnv = process.env.NODE_ENV === 'test';

const sequelize = isTestEnv
  ? new Sequelize('sqlite::memory:', {
      logging: false,
    })
  : new Sequelize({
      database: process.env.DB_NAME || 'tech_challenge_blog',
      username: process.env.DB_USER || 'admin',
      password: dbPassword,
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      dialect: 'postgres',
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000,
      },
      // Intentional performance issue: missing connection pool optimization
      dialectOptions: {
        // Missing SSL configuration for production
        ...(process.env.NODE_ENV === 'production' && {
          ssl: {
            require: true,
            rejectUnauthorized: false
          }
        })
      }
    });

export { sequelize };
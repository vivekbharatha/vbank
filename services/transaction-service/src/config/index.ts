interface Config {
  SERVICE_NAME: string;
  PORT: number;
  DATABASE_URL: string;
  REDIS_URL: string;
  KAFKA_BROKER: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  LOG_LEVEL: string;
  API_KEY: string;
  CENTRAL_BANK_API_URL: string;
  CENTRAL_BANK_API_KEY: string;
  API_GATEWAY_URL: string;
}

export const config: Config = {
  SERVICE_NAME: require('../../package.json').name,
  PORT: Number(process.env.PORT) || 3003,
  DATABASE_URL:
    process.env.DATABASE_URL || 'postgres://user:password@localhost:5432/auth',
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  KAFKA_BROKER: process.env.KAFKA_BROKER || 'localhost:9092',
  JWT_SECRET: process.env.JWT_SECRET || 'your-default-secret-key',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  API_KEY: process.env.API_KEY || 'your-default-api-key',
  CENTRAL_BANK_API_URL:
    process.env.CENTRAL_BANK_API_URL || 'http://localhost:5000',
  CENTRAL_BANK_API_KEY: process.env.CENTRAL_BANK_API_KEY || 'central-bank-key',
  API_GATEWAY_URL: process.env.API_GATEWAY_URL || 'http://localhost:3000',
};

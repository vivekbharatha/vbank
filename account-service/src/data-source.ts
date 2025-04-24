import { DataSource } from 'typeorm';
import { Account } from './entity/account.entity';

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  synchronize: true,
  logging: false,
  entities: [Account],
});

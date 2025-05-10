import { DataSource } from 'typeorm';
import { Transaction } from './entity/transaction.entity';

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  synchronize: true,
  logging: false,
  entities: [Transaction],
});

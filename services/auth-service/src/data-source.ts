import { DataSource } from 'typeorm';
import { User } from './entity/user.entity';
import { Credential } from './entity/credential.entity';

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  synchronize: true,
  logging: false,
  entities: [User, Credential],
});

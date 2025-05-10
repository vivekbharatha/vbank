import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import { verifyToken } from './middlewares/auth.middleware';
import { transactionRouter, indexRouter } from './routes';
import logger from './config/logger';
import { reqLogger } from './middlewares/req.middleware';
import { AppDataSource } from './data-source';
import { config } from './config';
import init from './init';
import { errorHandler } from './middlewares/error.middleware';

const app = express();

app.use(reqLogger);
app.use(express.json());
app.use(verifyToken);

app.use('/', indexRouter);
app.use('/api/v1/transactions', transactionRouter);

app.use(errorHandler);

AppDataSource.initialize()
  .then(async () => {
    await init();

    app.listen(config.PORT, () => {
      logger.info(
        `${config.SERVICE_NAME} is running on http://localhost:${config.PORT}`,
      );
    });
  })
  .catch((err) => {
    console.error('Error during Data Source initialization', err);
  });

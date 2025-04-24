import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import helmet from 'helmet';

import { verifyToken } from './middlewares/auth.middleware';
import { errorHandler } from './middlewares/error.middleware';
import { corsMiddleware } from './middlewares/cors.middleware';
import logger from './config/logger';
import { reqLogger } from './middlewares/req.middleware';
import { AppDataSource } from './data-source';
import { config } from './config';
import { authRouter, indexRouter } from './routes';
import init from './init';
import { setupGracefulShutdown } from './utils/shutdown';

const app = express();

app.use(helmet());
app.use(corsMiddleware);

app.use(reqLogger);
app.use(express.json());
app.use(verifyToken);

app.use('/', indexRouter);
app.use('/api/v1/auth', authRouter);

app.use(errorHandler);

AppDataSource.initialize()
  .then(async () => {
    await init();

    const server = app.listen(config.PORT, () => {
      logger.info(
        `${config.SERVICE_NAME} is running on http://localhost:${config.PORT}`,
      );
    });

    setupGracefulShutdown(server);
  })
  .catch((err) => {
    logger.error('error during Data Source initialization', err);
  });

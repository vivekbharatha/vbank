import { connectKafka } from '../events/kafka';
import { startConsumers } from '../events/consumers';
import logger from '../config/logger';
import { config } from '../config';

export default async () => {
  try {
    await connectKafka();

    await startConsumers();

    logger.info(`${config.SERVICE_NAME} initialized successfully`);
  } catch (error) {
    logger.error(`Failed to initialize ${config.SERVICE_NAME}`, error);
    throw error;
  }
};

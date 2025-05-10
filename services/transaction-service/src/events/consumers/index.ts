import { config } from '../../config';
import logger from '../../config/logger';
import { startTransactionEventsConsumer } from './transactionEvents.consumer';

export const startConsumers = async (): Promise<void> => {
  try {
    logger.info(`Starting Kafka consumers for ${config.SERVICE_NAME}`);

    await startTransactionEventsConsumer();

    logger.info(
      `All Kafka consumers started successfully for ${config.SERVICE_NAME}`,
    );
  } catch (error) {
    logger.error('Failed to start Kafka consumers', error);
    throw error;
  }
};

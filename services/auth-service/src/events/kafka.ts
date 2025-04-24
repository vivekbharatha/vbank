import KafkaClient from '@vbank/kafka-client';
import { config } from '../config';
import logger from '../config/logger';

const kafkaClient = new KafkaClient(config.SERVICE_NAME, [config.KAFKA_BROKER]);

export const producer = kafkaClient.getProducer();

export const connectKafka = async () => {
  try {
    await kafkaClient.connect();
    logger.info('Kafka producer connected');
  } catch (error) {
    logger.error('Failed to connect Kafka producer/consumer', error);
    throw error;
  }
};

export const disconnectKafka = async () => {
  try {
    await kafkaClient.disconnect();
    logger.info('Kafka producer disconnected');
  } catch (error) {
    logger.error('Failed to disconnect Kafka producer', error);
  }
};

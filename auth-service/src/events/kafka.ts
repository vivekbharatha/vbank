import { Kafka, Partitioners } from 'kafkajs';
import { config } from '../config';
import logger from '../config/logger';

const kafka = new Kafka({
  clientId: config.SERVICE_NAME,
  brokers: [config.KAFKA_BROKER],
});

export const producer = kafka.producer({
  allowAutoTopicCreation: true,
  createPartitioner: Partitioners.DefaultPartitioner,
});

export const connectKafka = async () => {
  try {
    await producer.connect();
    logger.info('Kafka producer connected');
  } catch (error) {
    logger.error('Failed to connect Kafka producer/consumer', error);
    throw error;
  }
};

export const disconnectKafka = async () => {
  try {
    await producer.disconnect();
    logger.info('Kafka producer disconnected');
  } catch (error) {
    logger.error('Failed to disconnect Kafka producer', error);
  }
};

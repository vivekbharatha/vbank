import Redis from 'ioredis';
import { config } from '.';
import logger from './logger';

class RedisClient {
  private static instance: Redis;
  private static isConnected = false;

  private constructor() {}

  public static getInstance(): Redis {
    if (!RedisClient.instance) {
      RedisClient.instance = new Redis(config.REDIS_URL, {
        retryStrategy: (times: number) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
        maxRetriesPerRequest: 3,
      });

      RedisClient.setupEventListeners();
    }
    return RedisClient.instance;
  }

  private static setupEventListeners(): void {
    RedisClient.instance.on('connect', () => {
      RedisClient.isConnected = true;
      logger.info('Connected to Redis');
    });

    RedisClient.instance.on('error', (error) => {
      RedisClient.isConnected = false;
      logger.error('Redis connection error:', error);
    });

    RedisClient.instance.on('close', () => {
      RedisClient.isConnected = false;
      logger.warn('Redis connection closed');
    });

    RedisClient.instance.on('reconnecting', () => {
      logger.info('Reconnecting to Redis...');
    });

    RedisClient.instance.on('ready', () => {
      logger.info('Redis client is ready');
    });

    RedisClient.instance.on('end', () => {
      RedisClient.isConnected = false;
      logger.info('Redis connection ended');
    });
  }

  public static async closeConnection() {
    if (RedisClient.instance) {
      try {
        await RedisClient.instance.quit();
        logger.info('Redis connection closed');
      } catch (error) {
        logger.error('Error closing Redis connection:', error);
      }
    }
  }

  public static isReady(): boolean {
    return RedisClient.isConnected;
  }

  public static async testConnection(): Promise<boolean> {
    try {
      await RedisClient.instance.ping();
      return true;
    } catch (error) {
      logger.error('Redis connection test failed:', error);
      return false;
    }
  }
}

export default RedisClient.getInstance();
export { RedisClient };

import Redis from "ioredis";
import { getLogger } from "@vbank/logger";

const logger = getLogger("@vbank/redis-client", "info");

class RedisClient {
  private instance: Redis;
  private isConnected = false;
  private REDIS_URL: string;
  private options: Record<string, unknown>;

  constructor(REDIS_URL: string, options?: Record<string, unknown>) {
    this.REDIS_URL = REDIS_URL;
    this.options = options || {
      retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
    };

    this.instance = new Redis(this.REDIS_URL, this.options);
    this.setupEventListeners();
  }

  public getInstance(): Redis {
    return this.instance;
  }

  private setupEventListeners(): void {
    this.instance.on("connect", () => {
      this.isConnected = true;
      logger.info("Connected to Redis");
    });

    this.instance.on("error", (error) => {
      this.isConnected = false;
      logger.error("Redis connection error:", error);
    });

    this.instance.on("close", () => {
      this.isConnected = false;
      logger.warn("Redis connection closed");
    });

    this.instance.on("reconnecting", () => {
      logger.info("Reconnecting to Redis...");
    });
  }

  public isReady(): boolean {
    return this.isConnected;
  }

  public async closeConnection() {
    if (this.instance) {
      try {
        await this.instance.quit();
        logger.info('Redis connection closed');
      } catch (error) {
        logger.error('Error closing Redis connection:', error);
      }
    }
  }
}

export default RedisClient;

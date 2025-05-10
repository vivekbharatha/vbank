import RedisClient from '@vbank/redis-client';
import { config } from '.';

export const redisClient = new RedisClient(config.REDIS_URL);

export default redisClient.getInstance();

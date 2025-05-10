import rateLimit from 'express-rate-limit';
import { config } from '../config';

export const limiter = rateLimit({
  skip: (req, res) => {
    return config.NODE_ENV !== 'production';
  },
  windowMs: 15 * 60 * 1000,
  max: 100,
});

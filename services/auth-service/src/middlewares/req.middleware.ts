import { NextFunction, Request, Response } from 'express';
import logger from '../config/logger';

export const reqLogger = (req: Request, res: Response, next: NextFunction) => {
  logger.debug(`[${req.method}] ${req.originalUrl}`);
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(
      `[${req.method}] ${req.originalUrl} - status: ${res.statusCode} - ${duration}ms`,
    );
  });

  next();
};

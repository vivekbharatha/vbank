import { NextFunction, Request, Response } from 'express';

export interface ServiceConfig {
  path: string;
  url: string;
  pathRewrite: Record<string, string>;
  name: string;
  timeout?: number;
}

export interface ProxyErrorResponse {
  message: string;
  status: number;
  timestamp: string;
}

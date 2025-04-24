export interface CustomError extends Error {
  statusCode?: number;
  status?: string;
}

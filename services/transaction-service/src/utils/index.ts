export class ApiError extends Error {
  statusCode: number;
  errorCode?: string;

  constructor(message: string, statusCode: number, errorCode?: string) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
  }
}

export const createError = (
  message: string,
  statusCode = 500,
  errorCode?: string
): ApiError => {
  return new ApiError(message, statusCode, errorCode);
};

export const createError = (message: string, statusCode: number): Error => {
  return Object.assign(new Error(message), { statusCode });
};

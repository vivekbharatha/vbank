import { UserType } from "./type";

export const config = {
  apiGatewayUrl: process.env.API_GATEWAY_URL || "http://localhost:3000",
  authServiceUrl: process.env.AUTH_SERVICE_URL || "http://localhost:3001",
  accountServiceUrl: process.env.ACCOUNT_SERVICE_URL || "http://localhost:3002",
};

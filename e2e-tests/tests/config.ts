import dotenv from "dotenv";
dotenv.config();

export const config = {
  apiGatewayUrl: process.env.API_GATEWAY_URL || "http://localhost:3000",
  authServiceUrl: process.env.AUTH_SERVICE_URL || "http://localhost:3001",
  accountServiceUrl: process.env.ACCOUNT_SERVICE_URL || "http://localhost:3002",
  transactionServiceUrl:
    process.env.TRANSACTION_SERVICE_URL || "http://localhost:3003",
  centralBankServiceUrl:
    process.env.CENTRAL_BANK_API_URL || "http://localhost:5010",
  centralBankServiceApiKey:
    process.env.CENTRAL_BANK_API_KEY || "proxy_central_bank_key",
};

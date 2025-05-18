import { TransactionType } from '../entity/transaction.entity';

export interface CustomError extends Error {
  statusCode?: number;
  status?: string;
}

export interface BaseTransactionDto {
  sourceAccountNumber: string;
  destinationAccountNumber: string;
  amount: number;
  transactionType: TransactionType;
  note?: string;
}

export interface TransferTransactionDto extends BaseTransactionDto {
  userId: number;
}

export interface ExternalTransferTransactionDto extends BaseTransactionDto {
  sourceBankCode?: string;
  destinationBankCode?: string;
  referenceId?: string;
  userId?: number;
}

export interface ExternalTransferReceiptDto {
  referenceId: string;
  status: string;
  error?: string;
  timestamp: Date;
}

export interface ExternalTransactionInboundDto {
  sourceAccount: string;
  destinationAccount: string;
  amount: number;
  sourceBankCode: string;
  destinationBankCode: string;
  note?: string;
  timestamp?: Date;
  referenceId: string;
}

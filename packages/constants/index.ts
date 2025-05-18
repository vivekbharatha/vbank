export const BANK_CODE = "VBANK";

export const USER_TOPICS = {
  ACCOUNT_CREATED: "account.created",
  ACCOUNT_DELETED: "account.deleted",
  USER_REGISTERED: "user.registered",
};

export const TRANSACTION_TOPICS = {
  TRANSACTION_EVENTS: "transaction.events",
};

export const TRANSACTION_EVENT_TYPES = {
  INITIATED: "INITIATED",
  ACCOUNT_DEBITED: "ACCOUNT_DEBITED",
  ACCOUNT_DEBIT_FAILED: "ACCOUNT_DEBIT_FAILED",
  ACCOUNT_CREDITED: "ACCOUNT_CREDITED",
  ACCOUNT_CREDIT_FAILED: "ACCOUNT_CREDIT_FAILED",
  ACCOUNT_DEBIT_COMPENSATED: "ACCOUNT_DEBIT_COMPENSATED",
  COMPLETED: "COMPLETED",
  FAILED: "FAILED",
};

export const ERROR_CODES = {
  ACCOUNT_NOT_FOUND: "ET01",
  INSUFFICIENT_BALANCE: "ET02",
  TRANSACTION_FAILED: "ET03",
};

export enum TransactionStatus {
  INITIATED = "initiated",
  DEBIT_SUCCESS = "debit_success",
  CREDIT_SUCCESS = "credit_success",
  FAILED = "failed",
  CREDIT_FAILED = "credit_failed",
  DEBIT_COMPENSATE = "debit_compensate",
  COMPENSATION_SUCCESS = "compensation_success",
  COMPLETED = "completed",
}

export interface TransactionEventData {
  userId?: number;
  transactionId: string;
  eventType: string;
  status: TransactionStatus;
  amount: number;
  sourceAccountNumber: string;
  destinationAccountNumber: string;
  transactionType: string;
  isInternal: boolean;
  timestamp?: number;
  isSourceExternal?: boolean;
  isDestinationExternal?: boolean;
  sourceBankCode?: string;
  destinationBankCode?: string;
  sourceAccountBalance?: number;
  destinationAccountBalance?: number;
  sourceDebitedAt?: Date;
  destinationCreditedAt?: Date;
  compensatedAt?: Date;
  note?: string;
  referenceId?: string;
  error?: string;
  errorCode?: string;
}

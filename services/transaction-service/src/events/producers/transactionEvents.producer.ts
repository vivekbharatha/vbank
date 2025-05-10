import { TRANSACTION_TOPICS } from '@vbank/constants';
import { BaseProducer } from '@vbank/kafka-client';
import { producer } from '../kafka';
import { TransactionStatus } from '../../entity/transaction.entity';

export interface TransactionEventData {
  userId: number;
  transactionId: string;
  eventType: string;
  status: TransactionStatus;
  sourceAccountNumber: string;
  destinationAccountNumber: string;
  amount: number;
  transactionType: string;
  isInternal: boolean;
  timestamp?: number;
  sourceDebitedAt?: Date;
  destinationCreditedAt?: Date;
  compensatedAt?: Date;
  sourceAccountBalance?: number;
  destinationAccountBalance?: number;
  error?: string;
  errorCode?: string;
}

export interface TransactionInitiatedEventData extends TransactionEventData {}

class TransactionEventsProducer extends BaseProducer<TransactionEventData> {
  protected readonly topic = TRANSACTION_TOPICS.TRANSACTION_EVENTS;

  constructor() {
    super(producer);
  }
}

const transactionEventsProducer = new TransactionEventsProducer();

export const publishTransactionEvent = async <T extends TransactionEventData>(
  eventData: T,
): Promise<void> => {
  return transactionEventsProducer.publish({
    key: eventData.transactionId,
    value: {
      ...eventData,
      timestamp: Date.now(),
    },
  });
};

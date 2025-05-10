import { TRANSACTION_TOPICS } from '@vbank/constants';
import { BaseProducer } from '@vbank/kafka-client';
import { producer } from '../kafka';

export interface TransactionEventData {
  eventType: string;
  transactionId: string;
  timestamp?: number;
}

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

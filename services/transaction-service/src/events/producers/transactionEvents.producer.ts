import { TRANSACTION_TOPICS, TransactionEventData } from '@vbank/constants';
import { BaseProducer } from '@vbank/kafka-client';
import { producer } from '../kafka';

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

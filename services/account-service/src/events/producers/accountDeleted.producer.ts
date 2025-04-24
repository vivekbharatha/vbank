import { USER_TOPICS } from '@vbank/constants';
import { BaseProducer, KafkaMessage } from '@vbank/kafka-client';
import { producer } from '../kafka';

export interface AccountDeletedData {
  id: number;
}

class AccountDeletedProducer extends BaseProducer<AccountDeletedData> {
  protected readonly topic = USER_TOPICS.ACCOUNT_DELETED;

  constructor() {
    super(producer);
  }
}

const accountDeletedProducer = new AccountDeletedProducer();

export const publishAccountDeleted = async (
  data: KafkaMessage<AccountDeletedData>,
): Promise<void> => accountDeletedProducer.publish(data);

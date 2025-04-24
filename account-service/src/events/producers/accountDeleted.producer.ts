import { USER_TOPICS } from '../../constants';
import { BaseProducer, KafkaMessage } from './base.producer';

export interface AccountDeletedData {
  id: number;
}

export class AccountDeletedProducer extends BaseProducer<AccountDeletedData> {
  protected readonly topic = USER_TOPICS.ACCOUNT_DELETED;
}

const accountDeletedProducer = new AccountDeletedProducer();

export const publishAccountDeleted = async (
  data: KafkaMessage<AccountDeletedData>,
): Promise<void> => accountDeletedProducer.publish(data);

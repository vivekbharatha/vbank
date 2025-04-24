import { USER_TOPICS } from '../../constants';
import { BaseProducer, KafkaMessage } from './base.producer';

export interface AccountCreatedData {
  id: number;
}

export class AccountCreatedProducer extends BaseProducer<AccountCreatedData> {
  protected readonly topic = USER_TOPICS.ACCOUNT_CREATED;
}

const accountCreatedProducer = new AccountCreatedProducer();

export const publishAccountCreated = async (
  data: KafkaMessage<AccountCreatedData>,
): Promise<void> => accountCreatedProducer.publish(data);

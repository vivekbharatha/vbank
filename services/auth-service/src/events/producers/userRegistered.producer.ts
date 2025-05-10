import { BaseProducer, KafkaMessage } from '@vbank/kafka-client';
import { USER_TOPICS } from '@vbank/constants';

const { producer } = require('../kafka');

export interface UserRegisteredData {
  id: number;
}

class UserRegisteredProducer extends BaseProducer<UserRegisteredData> {
  protected readonly topic = USER_TOPICS.USER_REGISTERED;

  constructor() {
    super(producer);
  }
}

const userRegisteredProducer = new UserRegisteredProducer();

export const publishUserRegistered = async (
  data: KafkaMessage<UserRegisteredData>,
): Promise<void> => userRegisteredProducer.publish(data);

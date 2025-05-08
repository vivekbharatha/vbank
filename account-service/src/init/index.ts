import { connectKafka } from '../events/kafka';

export default async () => {
  await connectKafka();
};

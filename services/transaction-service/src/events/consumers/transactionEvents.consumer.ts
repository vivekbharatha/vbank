import { Consumer } from 'kafkajs';
import { TRANSACTION_TOPICS, TRANSACTION_EVENT_TYPES } from '@vbank/constants';
import { TransactionStatus } from '../../entity/transaction.entity';
import { transactionService } from '../../services/transaction.service';
import logger from '../../config/logger';
import { createConsumer } from '../kafka';
import { TransactionEventData } from '../producers/transactionEvents.producer';

export const startTransactionEventsConsumer = async (): Promise<Consumer> => {
  const consumer = createConsumer('ts-transaction-events-cg');

  await consumer.connect();
  await consumer.subscribe({
    topic: TRANSACTION_TOPICS.TRANSACTION_EVENTS,
    fromBeginning: false,
  });

  await consumer.run({
    eachMessage: async (messagePayload) => {
      const { topic, partition, message } = messagePayload;
      const value = message.value?.toString();

      if (!value) {
        logger.warn(`[${topic}.${partition}]: empty message received`);
        return;
      }

      try {
        const eventData = JSON.parse(value) as TransactionEventData;
        const { eventType, transactionId } = eventData;

        logger.info(
          `[${topic}.${partition}]: processing ${eventType} event for transaction ${transactionId}`,
        );

        switch (eventType) {
          case TRANSACTION_EVENT_TYPES.ACCOUNT_DEBITED:
            await transactionService.updateStatus(transactionId, {
              status: TransactionStatus.DEBIT_SUCCESS,
              sourceDebitedAt: eventData.sourceDebitedAt,
            });
            break;

          case TRANSACTION_EVENT_TYPES.ACCOUNT_CREDITED:
            await transactionService.updateStatus(transactionId, {
              status: TransactionStatus.COMPLETED,
              destinationCreditedAt: eventData.destinationCreditedAt,
              completedAt: eventData.destinationCreditedAt,
            });
            break;

          case TRANSACTION_EVENT_TYPES.ACCOUNT_DEBIT_FAILED:
            const { error, errorCode } = eventData;
            await transactionService.updateStatus(transactionId, {
              status: TransactionStatus.FAILED,
              errorDetails: `event: ${TRANSACTION_EVENT_TYPES.ACCOUNT_DEBIT_FAILED}, error: ${error}, errorCode: ${errorCode}`,
              completedAt: new Date(eventData.timestamp!),
            });
            break;

          case TRANSACTION_EVENT_TYPES.ACCOUNT_CREDIT_FAILED:
            const creditError = eventData.error;
            const creditErrorCode = eventData.errorCode;
            await transactionService.updateStatus(transactionId, {
              status: TransactionStatus.CREDIT_FAILED,
              errorDetails: `event: ${TRANSACTION_EVENT_TYPES.ACCOUNT_CREDIT_FAILED}, error: ${creditError}, errorCode: ${creditErrorCode}`,
            });
            break;

          case TRANSACTION_EVENT_TYPES.ACCOUNT_DEBIT_COMPENSATED:
            await transactionService.updateStatus(transactionId, {
              status: TransactionStatus.FAILED,
              errorDetails: `event: ${TRANSACTION_EVENT_TYPES.ACCOUNT_DEBIT_COMPENSATED}`,
              compensatedAt: eventData.compensatedAt,
              completedAt: eventData.compensatedAt,
            });
            break;

          default:
            logger.warn(
              `Unhandled event type: ${eventType} for transaction: ${transactionId}`,
            );
        }
      } catch (error) {
        logger.error(
          `[${topic}.${partition}]: Error processing transaction event`,
          error,
        );
      }
    },
  });

  return consumer;
};

import { Consumer } from 'kafkajs';
import {
  TRANSACTION_TOPICS,
  TRANSACTION_EVENT_TYPES,
  TransactionEventData,
  TransactionStatus,
} from '@vbank/constants';
import { transactionService } from '../../services/transaction.service';
import logger from '../../config/logger';
import { createConsumer } from '../kafka';
import { publishTransactionEvent } from '../producers/transactionEvents.producer';

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
            await handleAccountDebited(eventData);
            break;

          case TRANSACTION_EVENT_TYPES.ACCOUNT_CREDITED:
            await handleAccountCredited(eventData);
            break;

          case TRANSACTION_EVENT_TYPES.ACCOUNT_DEBIT_FAILED:
            await handleAccountDebitFailed(eventData);
            break;

          case TRANSACTION_EVENT_TYPES.ACCOUNT_CREDIT_FAILED:
            await handleAccountCreditFailed(eventData);
            break;

          case TRANSACTION_EVENT_TYPES.ACCOUNT_DEBIT_COMPENSATED:
            await handleAccountDebitCompensated(eventData);
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

async function handleAccountDebited(
  eventData: TransactionEventData,
): Promise<void> {
  const { transactionId, isDestinationExternal } = eventData;

  await transactionService.updateStatus(transactionId, {
    status: TransactionStatus.DEBIT_SUCCESS,
    sourceDebitedAt: eventData.sourceDebitedAt,
  });

  if (!isDestinationExternal) {
    return;
  }

  try {
    await transactionService.externalCredit(eventData);
  } catch (error: any) {
    await publishTransactionEvent({
      ...eventData,
      eventType: TRANSACTION_EVENT_TYPES.ACCOUNT_CREDIT_FAILED,
      error: error.message || error.string || error.toString(),
      errorCode: error.errorCode || null,
    });

    logger.error(
      `Failed to credit account for transaction ${transactionId}: ${error.message}`,
    );
  }
}

async function handleAccountCredited(
  eventData: TransactionEventData,
): Promise<void> {
  const { transactionId, isSourceExternal } = eventData;

  await transactionService.updateStatus(transactionId, {
    status: TransactionStatus.COMPLETED,
    destinationCreditedAt: eventData.destinationCreditedAt,
    completedAt: eventData.destinationCreditedAt,
  });

  if (!isSourceExternal) {
    return;
  }

  try {
    await transactionService.notifyCentralBank(eventData);
  } catch (error: any) {
    logger.error(
      `Failed to notify central bank for transaction ${transactionId}: ${error.message}`,
    );
  }
}

async function handleAccountCreditFailed(
  eventData: TransactionEventData,
): Promise<void> {
  const { transactionId, isSourceExternal, error, errorCode } = eventData;

  // Set the transaction status to FAILED directly as it's an external inbound transaction
  // no compensation logic needed for this scope of course
  await transactionService.updateStatus(transactionId, {
    status: TransactionStatus.FAILED,
    completedAt: new Date(),
    errorDetails: `event: ${TRANSACTION_EVENT_TYPES.ACCOUNT_CREDIT_FAILED}, error: ${error}, errorCode: ${errorCode}`,
  });

  if (!isSourceExternal) {
    return;
  }

  try {
    await transactionService.notifyCentralBank(eventData);
  } catch (error: any) {
    logger.error(
      `Failed to notify central bank for transaction ${transactionId}: ${error.message}`,
    );
  }
}

async function handleAccountDebitFailed(
  eventData: TransactionEventData,
): Promise<void> {
  const { transactionId, error, errorCode, timestamp } = eventData;
  await transactionService.updateStatus(transactionId, {
    status: TransactionStatus.FAILED,
    errorDetails: `event: ${TRANSACTION_EVENT_TYPES.ACCOUNT_DEBIT_FAILED}, error: ${error}, errorCode: ${errorCode}`,
    completedAt: new Date(timestamp!),
  });
}

async function handleAccountDebitCompensated(
  eventData: TransactionEventData,
): Promise<void> {
  const { transactionId, compensatedAt } = eventData;
  await transactionService.updateStatus(transactionId, {
    status: TransactionStatus.FAILED,
    errorDetails: `event: ${TRANSACTION_EVENT_TYPES.ACCOUNT_DEBIT_COMPENSATED}`,
    compensatedAt: compensatedAt,
    completedAt: compensatedAt,
  });
}

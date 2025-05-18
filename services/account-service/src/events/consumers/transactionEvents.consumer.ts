import { Consumer } from 'kafkajs';
import {
  TRANSACTION_TOPICS,
  TRANSACTION_EVENT_TYPES,
  TransactionEventData,
} from '@vbank/constants';
import logger from '../../config/logger';
import { kafkaClient } from '../kafka';
import { accountService } from '../../services/account.service';
import { TransactionType } from '../../types/transaction.types';
import { publishTransactionEvent } from '../producers/transactionEvents.producer';

export const startTransactionEventsConsumer = async (): Promise<Consumer> => {
  const consumer = kafkaClient.createConsumer('as-transaction-events-cg');

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
          case TRANSACTION_EVENT_TYPES.INITIATED:
            await handleTransactionInitiated(eventData);
            break;

          case TRANSACTION_EVENT_TYPES.ACCOUNT_DEBITED:
            await handleAccountDebited(eventData);
            break;

          case TRANSACTION_EVENT_TYPES.ACCOUNT_CREDIT_FAILED:
            await handleAccountCreditFailed(eventData);
            break;

          default:
            logger.debug(
              `Ignoring event type: ${eventType} for transaction: ${transactionId} in account service`,
            );
        }
      } catch (error: any) {
        logger.error(
          `[${topic}.${partition}]: Error processing transaction event`,
          error,
        );
      }
    },
  });

  return consumer;
};

async function handleTransactionInitiated(
  eventData: TransactionEventData,
): Promise<void> {
  const {
    transactionId,
    sourceAccountNumber,
    amount,
    transactionType,
    isSourceExternal,
  } = eventData;

  try {
    if (transactionType !== 'transfer') {
      throw new Error(`Unsupported transaction type: ${transactionType}`);
    }

    if (isSourceExternal) {
      logger.info(
        `External source account detected for transaction ${transactionId}. Skipping debit.`,
      );
      return;
    }

    const sourceAccount = await accountService.updateBalance(
      sourceAccountNumber,
      TransactionType.DEBIT,
      amount,
    );

    await publishTransactionEvent({
      ...eventData,
      eventType: TRANSACTION_EVENT_TYPES.ACCOUNT_DEBITED,
      sourceAccountBalance: sourceAccount.balance,
      sourceDebitedAt: sourceAccount.updatedAt,
    });
  } catch (error: any) {
    await publishTransactionEvent({
      ...eventData,
      eventType: TRANSACTION_EVENT_TYPES.ACCOUNT_DEBIT_FAILED,
      error: error.message || error.string || error.toString(),
      errorCode: error.errorCode || null,
    });

    logger.error(
      `Failed to process transaction ${transactionId}: ${error.message}`,
    );
  }
}

async function handleAccountDebited(
  eventData: TransactionEventData,
): Promise<void> {
  const {
    transactionId,
    destinationAccountNumber,
    amount,
    isDestinationExternal,
  } = eventData;

  if (isDestinationExternal) {
    logger.info(
      `External destination account detected for transaction ${transactionId}. Skipping credit.`,
    );
    return;
  }

  try {
    const destinationAccount = await accountService.updateBalance(
      destinationAccountNumber,
      TransactionType.CREDIT,
      amount,
    );

    await publishTransactionEvent({
      ...eventData,
      eventType: TRANSACTION_EVENT_TYPES.ACCOUNT_CREDITED,
      destinationAccountBalance: destinationAccount.balance,
      destinationCreditedAt: destinationAccount.updatedAt,
    });
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

async function handleAccountCreditFailed(
  eventData: TransactionEventData,
): Promise<void> {
  const { transactionId, sourceAccountNumber, amount, isSourceExternal } =
    eventData;

  if (isSourceExternal) {
    logger.info(
      `External source account detected for transaction ${transactionId}. Skipping compensation.`,
    );
    return;
  }

  try {
    const sourceAccount = await accountService.updateBalance(
      sourceAccountNumber,
      TransactionType.CREDIT,
      amount,
    );

    await publishTransactionEvent({
      ...eventData,
      eventType: TRANSACTION_EVENT_TYPES.ACCOUNT_DEBIT_COMPENSATED,
      transactionId,
      sourceAccountBalance: sourceAccount.balance,
      compensatedAt: sourceAccount.updatedAt,
    });
  } catch (error: any) {
    // This is a critical failure as compensation failed
    // TODO: Raise an alert to notify the admin
    logger.error(
      `CRITICAL: Failed to compensate transaction ${transactionId}: ${error.message}`,
    );
  }
}

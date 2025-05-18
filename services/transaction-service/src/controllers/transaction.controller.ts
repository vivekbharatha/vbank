import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { TransactionType } from '../entity/transaction.entity';
import {
  TransactionService,
  transactionService,
} from '../services/transaction.service';
import logger from '../config/logger';
import { createError } from '../utils';
import { nanoid } from 'nanoid';

const transferSchema = z.object({
  sourceAccountNumber: z.string().min(15, 'source account number is required'),
  destinationAccountNumber: z
    .string()
    .min(15, 'destination account number is required'),
  amount: z.number().positive('Amount must be greater than zero'),
  note: z.string().optional(),
});

const transferExternalSchema = transferSchema.extend({
  sourceBankCode: z.string(),
  destinationBankCode: z.string(),
  referenceId: z.string().optional(),
});

export class TransactionController {
  transactionService: TransactionService;

  constructor(transactionService: TransactionService) {
    this.transactionService = transactionService;
  }

  async transfer(req: Request, res: Response, next: NextFunction) {
    const {
      sourceAccountNumber,
      destinationAccountNumber,
      amount,
      note = '',
    } = transferSchema.parse(req.body);

    const userId = req.userId;

    const transaction = await this.transactionService.create({
      userId,
      sourceAccountNumber,
      destinationAccountNumber,
      amount,
      transactionType: TransactionType.TRANSFER,
      note,
    });

    logger.info(`created new transaction: ${transaction.transactionId}`);

    res.status(201).json({
      transactionId: transaction.transactionId,
      status: transaction.status,
    });
  }

  async transferExternalOutbound(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    const {
      sourceAccountNumber,
      destinationAccountNumber,
      amount,
      note = '',
      sourceBankCode,
      destinationBankCode,
      referenceId,
    } = transferExternalSchema.parse(req.body);

    const userId = req.userId;

    const transaction = await this.transactionService.createExternal({
      userId,
      sourceAccountNumber,
      destinationAccountNumber,
      amount,
      transactionType: TransactionType.TRANSFER,
      note,
      sourceBankCode,
      destinationBankCode,
      referenceId: referenceId || nanoid(),
    });

    logger.info(
      `created new external transaction: ${transaction.transactionId}`,
    );

    res.status(201).json({
      transactionId: transaction.transactionId,
      status: transaction.status,
      referenceId: transaction.referenceId,
    });
  }

  async getByTransactionId(req: Request, res: Response, next: NextFunction) {
    const { transactionId } = req.params;

    const transaction =
      await transactionService.getByTransactionId(transactionId);

    if (!transaction) {
      throw createError(`Transaction ${transactionId} not found`, 404);
    }

    if (transaction.userId !== req.userId) {
      throw createError('Unauthorized', 403);
    }

    res.status(200).json(transaction);
  }

  async getByReferenceId(req: Request, res: Response, next: NextFunction) {
    const { referenceId } = req.params;

    const transaction =
      await this.transactionService.getByReferenceId(referenceId);

    if (!transaction) {
      throw createError(
        `Transaction with reference ID ${referenceId} not found`,
        404,
      );
    }

    if (transaction.userId && transaction.userId !== req.userId) {
      throw createError('Unauthorized', 403);
    }

    res.status(200).json(transaction);
  }
}

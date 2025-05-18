import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { TransactionService } from '../services/transaction.service';
import logger from '../config/logger';

const TransferExternalReceiptSchema = z.object({
  referenceId: z.string(),
  status: z.string(),
  error: z.string().optional(),
  timestamp: z.string().transform((val) => new Date(val)),
});

const TransferExternalInboundSchema = z.object({
  sourceAccount: z.string(),
  destinationAccount: z.string(),
  amount: z.number().positive(),
  sourceBankCode: z.string(),
  destinationBankCode: z.string(),
  note: z.string().optional(),
  referenceId: z.string(),
  timestamp: z.string().transform((val) => new Date(val)),
});

export class ExternalTransactionController {
  transactionService: TransactionService;

  constructor(transactionService: TransactionService) {
    this.transactionService = transactionService;
  }

  async transferExternalReceipt(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { referenceId, status, error, timestamp } =
        TransferExternalReceiptSchema.parse(req.body);

      await this.transactionService.processExternalReceipt({
        referenceId,
        status,
        error,
        timestamp,
      });

      res.status(200).json({
        acknowledged: true,
        referenceId,
      });
    } catch (error) {
      next(error);
    }
  }

  async transferExternalInbound(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const payload = TransferExternalInboundSchema.parse(req.body);

      await this.transactionService.processExternalInbound(payload);

      res.status(200).json({
        acknowledged: true,
        referenceId: payload.referenceId,
      });
    } catch (error) {
      next(error);
    }
  }
}

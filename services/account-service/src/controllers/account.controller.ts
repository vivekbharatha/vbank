import { Request, Response } from 'express';
import { z } from 'zod';

import { AccountType } from '../entity/account.entity';
import { AccountService } from '../services/account.service';
import { SAVINGS_ACCOUNT } from '../constants';
import { TransactionType } from '../types/transaction.types';

const createSchema = z.object({
  accountType: z
    .nativeEnum(AccountType)
    .optional()
    .default(AccountType.SAVINGS),
  accountName: z.string().optional().default(SAVINGS_ACCOUNT),
});

const transactionSchema = z.object({
  accountNumber: z.string().length(15),
  amount: z.number().positive().multipleOf(0.01),
  type: z.nativeEnum(TransactionType),
});

export class AccountController {
  accountService: AccountService;

  constructor(accountService: AccountService) {
    this.accountService = accountService;
  }

  async create(req: Request, res: Response): Promise<any> {
    const { accountType, accountName } = createSchema.parse(req.body);

    const account = await this.accountService.create({
      userId: req.userId,
      accountType,
      accountName,
    });

    return res.status(201).json(account);
  }

  async list(req: Request, res: Response): Promise<any> {
    const accounts = await this.accountService.list(req.userId);

    return res.status(200).json(accounts);
  }

  async get(req: Request, res: Response): Promise<any> {
    const account = await this.accountService.findByAccountNumber(
      req.params.accountNumber,
      parseInt(req.params.userId),
    );

    return res.status(200).json(account);
  }

  async delete(req: Request, res: Response): Promise<any> {
    await this.accountService.delete(req.userId, req.params.accountNumber);

    return res.status(200).json({ message: 'account deleted' });
  }

  async internalTransaction(req: Request, res: Response): Promise<any> {
    const { accountNumber, amount, type } = transactionSchema.parse(req.body);

    const account = await this.accountService.updateBalance(
      accountNumber,
      type,
      amount,
    );

    return res.status(200).json({
      message: `account transaction ${type} completed`,
      availableBalance: account.balance,
    });
  }
}

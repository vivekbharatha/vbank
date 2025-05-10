import { AppDataSource } from '../data-source';
import { Repository } from 'typeorm';
import { AccountType, Account } from '../entity/account.entity';
import { createError, generateAccountNumber } from '../utils';
import { ERROR_CODES } from '@vbank/constants';
import { publishAccountCreated } from '../events/producers/accountCreated.producer';
import logger from '../config/logger';
import { publishAccountDeleted } from '../events/producers/accountDeleted.producer';
import { SAVINGS_ACCOUNT } from '../constants';
import { TransactionType } from '../types/transaction.types';

interface AccountCreateDto {
  userId: number;
  accountType?: AccountType;
  accountName?: string;
}

export class AccountService {
  accountRepository: Repository<Account>;

  constructor() {
    this.accountRepository = AppDataSource.getRepository(Account);
  }

  async create({
    userId,
    accountName = SAVINGS_ACCOUNT,
    accountType = AccountType.SAVINGS,
  }: AccountCreateDto) {
    const existing = await this.accountRepository.findOneBy({
      userId,
      accountType,
    });

    if (existing) {
      throw createError('account already exists', 400);
    }

    const account = new Account();
    account.userId = userId;
    account.accountNumber = generateAccountNumber(accountType);
    account.accountType = accountType;
    account.accountName = accountName;
    account.balance = 0;

    await this.accountRepository.save(account);

    await publishAccountCreated({
      key: userId.toString(),
      value: account,
    });

    return account;
  }

  async list(userId: number) {
    const accounts = await this.accountRepository.find({
      where: { userId },
    });

    return accounts;
  }

  async findByAccountNumber(accountNumber: string, userId?: number) {
    const account = await this.accountRepository.findOneBy({
      accountNumber,
      ...(userId ? { userId } : {}),
    });

    if (!account) {
      throw createError('account not found', 404);
    }

    return account;
  }

  async delete(userId: number, accountNumber: string) {
    const account = await this.accountRepository.findOneBy({
      userId,
      accountNumber,
    });

    if (!account) {
      throw createError('account not found', 404);
    }

    const deleteRes = await this.accountRepository.delete({
      userId,
      accountNumber,
    });

    if (deleteRes.affected === 0) {
      throw createError('account not found', 404);
    } else if (deleteRes.affected === 1) {
      logger.info(
        `account ${accountNumber} deleted for user ${userId}`,
        deleteRes,
      );

      await publishAccountDeleted({
        key: userId.toString(),
        value: account,
      });
    } else {
      logger.error(
        `account ${accountNumber} deletion failed for user ${userId}`,
        deleteRes,
      );
      throw createError('account deletion failed', 500);
    }
  }

  async updateBalance(
    accountNumber: string,
    type: TransactionType,
    amount: number,
  ) {
    amount = Math.abs(amount);

    const account = await this.accountRepository.findOneBy({
      accountNumber,
    });

    if (!account) {
      throw createError('account not found', 404);
    }

    if (type === TransactionType.CREDIT) {
      account.balance += amount;
    } else if (type === TransactionType.DEBIT) {
      if (account.balance < amount) {
        throw createError('insufficient balance', 400);
      }

      account.balance -= amount;
    }

    account.balance = Number(account.balance.toFixed(2));
    await this.accountRepository.save(account);

    return account;
  }

  async updateBalanceByAccountNumber(
    accountNumber: string,
    type: TransactionType,
    amount: number,
  ) {
    amount = Math.abs(amount);

    const account = await this.accountRepository.findOneBy({
      accountNumber,
    });

    if (!account) {
      throw createError(
        'account not found',
        404,
        ERROR_CODES.ACCOUNT_NOT_FOUND,
      );
    }

    if (type === TransactionType.CREDIT) {
      account.balance += amount;
    } else if (type === TransactionType.DEBIT) {
      if (account.balance < amount) {
        throw createError(
          'insufficient balance',
          400,
          ERROR_CODES.INSUFFICIENT_BALANCE,
        );
      }

      account.balance -= amount;
    }

    account.balance = Number(account.balance.toFixed(2));
    await this.accountRepository.save(account);

    return account;
  }
}

export const accountService = new AccountService();

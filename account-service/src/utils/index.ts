import { customAlphabet } from 'nanoid';
import { AccountType } from '../entity/account.entity';

export const createError = (
  message: string,
  statusCode: number,
  errorCode = 'E0',
): Error => {
  return Object.assign(new Error(message), { statusCode, errorCode });
};

const accountTypeMap = {
  [AccountType.SAVINGS]: '11',
  [AccountType.CURRENT]: '13',
};

// returns 15 digits account number
export const generateAccountNumber = (
  accountType: AccountType,
  idLength: number = 7,
): string => {
  const date = new Date().toISOString().slice(0, 4).replace(/-/g, '');
  const uniqueId = customAlphabet('0123456789', idLength)();

  return `${accountTypeMap[accountType]}${date}${accountTypeMap[accountType]}${uniqueId}`;
};

export type UserType = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
};

export type AccountType = {
  id: number;
  userId: number;
  accountNumber: string;
  accountName: string;
  accountType: string;
  accountStatus: string;
  balance: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
  closedAt: null | string;
};

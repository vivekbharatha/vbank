import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
} from 'typeorm';

import { v4 as uuidv4 } from 'uuid';

export enum TransactionStatus {
  INITIATED = 'initiated',
  DEBIT_SUCCESS = 'debit_success',
  CREDIT_SUCCESS = 'credit_success',
  FAILED = 'failed',
  CREDIT_FAILED = 'credit_failed',
  DEBIT_COMPENSATE = 'debit_compensate',
  COMPENSATION_SUCCESS = 'compensation_success',
  COMPLETED = 'completed',
}

export enum TransactionType {
  TRANSFER = 'transfer',
  CREDIT = 'credit',
  DEBIT = 'debit',
}

export class DecimalColumnTransformer {
  to(data: number): number {
    return data;
  }
  from(data: string): number {
    return parseFloat(data);
  }
}

@Entity()
export class Transaction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({ name: 'transaction_id', unique: true })
  transactionId: string;

  @Column({ name: 'source_account_number' })
  sourceAccountNumber: string;

  @Column({ name: 'destination_account_number' })
  destinationAccountNumber: string;

  @Column({
    name: 'transaction_type',
    type: 'enum',
    enum: TransactionType,
  })
  transactionType: TransactionType;

  @Column({
    name: 'status',
    type: 'enum',
    enum: TransactionStatus,
    default: TransactionStatus.INITIATED,
  })
  status: TransactionStatus;

  @Column({
    name: 'amount',
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: new DecimalColumnTransformer(),
  })
  amount: number;

  @Column({ name: 'note', nullable: true })
  note: string;

  @Column({ name: 'reference_id', nullable: true })
  referenceId: string;

  @Column({ name: 'is_internal', default: true })
  isInternal: boolean;

  @Column({ name: 'details', nullable: true })
  details: string;

  @Column({ name: 'completed_at', nullable: true })
  completedAt: Date;

  @Column({ name: 'source_debited_at', nullable: true })
  sourceDebitedAt: Date;

  @Column({ name: 'destination_credited_at', nullable: true })
  destinationCreditedAt: Date;

  @Column({ name: 'compensated_at', nullable: true })
  compensatedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @BeforeInsert()
  generateTransactionId() {
    const uniquePart = uuidv4().replace(/-/g, '').toUpperCase();
    this.transactionId = `VBNK-${uniquePart}`;
  }
}

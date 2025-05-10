import { Router } from 'express';
import { TransactionController } from '../controllers/transaction.controller';
import { transactionService } from '../services/transaction.service';

const transactionRouter = Router();
const transactionController = new TransactionController(transactionService);

transactionRouter.post(
  '/transfer',
  transactionController.transfer.bind(transactionController),
);

transactionRouter.get(
  '/:transactionId',
  transactionController.getByTransactionId.bind(transactionController),
);

export { transactionRouter };

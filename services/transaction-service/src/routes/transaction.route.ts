import { Router } from 'express';
import { TransactionController } from '../controllers/transaction.controller';
import { transactionService } from '../services/transaction.service';
import { ExternalTransactionController } from '../controllers/external.transaction.controller';
import { config } from '../config';

const transactionRouter = Router();
const transactionController = new TransactionController(transactionService);
const externalTransactionController = new ExternalTransactionController(
  transactionService,
);

transactionRouter.post(
  '/transfer',
  transactionController.transfer.bind(transactionController),
);

transactionRouter.post(
  '/transfer/external/outbound',
  transactionController.transferExternalOutbound.bind(transactionController),
);

transactionRouter.get(
  '/:transactionId',
  transactionController.getByTransactionId.bind(transactionController),
);

transactionRouter.get(
  '/by-reference/:referenceId',
  transactionController.getByReferenceId.bind(transactionController),
);

transactionRouter.post(
  '/transfer/external/receipt',
  (req, res, next) => {
    if (req.headers['x-api-key'] !== config.API_KEY) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    next();
  },
  externalTransactionController.transferExternalReceipt.bind(
    externalTransactionController,
  ),
);

transactionRouter.post(
  '/transfer/external/inbound',
  (req, res, next) => {
    if (req.headers['x-api-key'] !== config.API_KEY) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    next();
  },
  externalTransactionController.transferExternalInbound.bind(
    externalTransactionController,
  ),
);

export { transactionRouter };

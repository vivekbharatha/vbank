import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import axios from 'axios';

import { z } from 'zod';
import { nanoid } from 'nanoid';

const app = express();
app.use(express.json());

// In-memory storage for transfers
const transfers = new Map<string, Transfer>();

// Bank configurations
const BANKS = {
  VBANK: {
    url: process.env.VBANK_API_URL || 'http://localhost:3000',
    apiKey: process.env.VBANK_API_KEY || 'vbank_key',
  },
};

// Types
interface Transfer {
  id: string;
  sourceAccount: string;
  destinationAccount: string;
  amount: number;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  sourceBankCode: string;
  destinationBankCode: string;
  timestamp: Date;
  referenceId?: string;
  callbackUrl?: string;
  note?: string;
}

const InbountTransferSchema = z.object({
  sourceAccount: z.string(),
  destinationAccount: z.string(),
  amount: z.number().positive(),
  sourceBankCode: z.string(),
  destinationBankCode: z.string(),
  callbackUrl: z.string().url(),
  referenceId: z.string(),
});

const OutboundTransferSchema = z.object({
  sourceAccount: z.string(),
  destinationAccount: z.string(),
  amount: z.number().positive(),
  sourceBankCode: z.string(),
  destinationBankCode: z.string(),
  note: z.string().optional(),
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'UP', timestamp: new Date() });
});

// auth middleware
app.use((req, res, next) => {
  console.log(`[${req.method}] ${req.originalUrl}`);
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(
      `[${req.method}] ${req.originalUrl} - status: ${res.statusCode} - ${duration}ms`,
    );
  });

  const apiKey = req.headers['x-api-key'];
  if (apiKey !== process.env.CENTRAL_BANK_API_KEY) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }

  next();
});

/**
 * TLDR - vbank calls this endpoint to process transactions where destination bank is external bank
 * INBOUND API - Accepts transactions from external sources like "vbank" [Source Bank] to external [Destination Bank]
 * This is a mock implementation, in a real-world scenario, you would call the actual bank API
 * and handle the response accordingly. This endpoint is for the Central Bank to receive transfers from other banks
 * and process them internally. It simulates the transfer process and sends a callback to the source bank
 * once the transfer is completed.
 *
 * The transfer is processed asynchronously with a random delay to simulate real-world processing time.
 * The transfer status is updated based on the amount for testing purposes.
 * The transfer is stored in memory for demonstration purposes.
 * In a real-world scenario, you would store the transfer in a database.
 */
app.post('/api/v1/transfers/inbound', (req, res) => {
  const payload = InbountTransferSchema.safeParse(req.body);

  if (!payload.success) {
    res.status(400).json({
      error: 'Invalid parameters',
      details: payload.error.issues,
    });
    return;
  }

  const {
    sourceAccount,
    destinationAccount,
    amount,
    callbackUrl,
    referenceId,
    sourceBankCode,
    destinationBankCode,
  } = payload.data;

  const transferId = `CB-${nanoid()}`;

  const transfer: Transfer = {
    id: transferId,
    sourceAccount,
    destinationAccount,
    amount,
    sourceBankCode,
    destinationBankCode,
    status: 'PENDING',
    callbackUrl,
    referenceId,
    timestamp: new Date(),
  };

  transfers.set(transferId, transfer);

  // Send acknowledgment immediately
  res.json({
    transferId,
    status: 'PENDING',
    message: 'Transfer request received and being processed',
  });

  // Process the transfer asynchronously with random delay (1-5 seconds)
  const delay = Math.floor(Math.random() * 5000) + 1000;
  setTimeout(() => {
    processExternalTransfer(transfer).catch(console.error);
  }, delay);
});

/**
 * TLDR - This endpoint is called by external banks to send transfers to vbank
 *
 * OUTBOUND API - Accepts transactions from external [Source Bank] to vbank [Destination Bank]
 * This is a mock implementation, in a real-world scenario, you would call the actual bank API
 * and handle the response accordingly. This endpoint is for the Central Bank to send transfers to vbank
 * and process them internally.
 */
app.post('/api/v1/transfers/outbound', async (req, res) => {
  const payload = OutboundTransferSchema.safeParse(req.body);

  if (!payload.success) {
    res.status(400).json({
      error: 'Invalid parameters',
      details: payload.error.issues,
    });
    return;
  }

  const {
    sourceAccount,
    destinationAccount,
    amount,
    sourceBankCode,
    destinationBankCode,
    note,
  } = payload.data;

  const transferId = `CB-${nanoid()}`;
  const transfer: Transfer = {
    id: transferId,
    sourceAccount,
    destinationAccount,
    sourceBankCode,
    destinationBankCode,
    amount,
    status: 'PENDING',
    timestamp: new Date(),
    referenceId: transferId,
    note,
  };

  transfers.set(transferId, transfer);

  // Send acknowledgment immediately
  res.json({
    transferId,
    status: 'PENDING',
    message: 'Transfer request to VBank initiated',
  });

  // Process the vbank transfer
  processVbankTransfer(transfer).catch(console.error);
});

/**
 * TLDR - This endpoint is called by vbank to report transaction status
 * This is a mock implementation, in a real-world scenario, you would call the actual bank API
 * and handle the response accordingly. This endpoint is for the Central Bank to receive callbacks from vbank
 * and process them internally. It simulates the transfer process and sends a callback to the source bank
 * once the transfer is completed.
 */
app.post('/api/v1/transfers/receipt/:transferId', async (req, res) => {
  const { transferId } = req.params;
  const { status, error } = req.body;

  console.log('Received receipt from vbank:', {
    transferId,
    status,
    error,
  });

  const transfer = transfers.get(transferId);
  if (!transfer) {
    res.status(404).json({ error: 'Transfer not found' });
    return;
  }

  // Update transfer status
  transfer.status = status;
  transfers.set(transferId, transfer);

  // Send acknowledgment to vbank
  res.json({ status: 'acknowledged' });

  // Notify the original requestor - this should point to the external bank, as a mock it should be commented, coz we don't have an external bank
  // await notifyRequestor(transfer, status, error);
});

// Get transfer status endpoint
app.get('/api/v1/transfers/:transferId/status', (req, res) => {
  const { transferId } = req.params;
  const transfer = transfers.get(transferId);

  if (!transfer) {
    res.status(404).json({ error: 'Transfer not found' });
    return;
  }

  res.json(transfer);
});

// Helper function to process external transfer with 50% success rate
async function processExternalTransfer(transfer: Transfer) {
  try {
    // Randomly decide success (50% chance)
    const isSuccess = Math.random() >= 0.5;

    // Set final status
    transfer.status = isSuccess ? 'SUCCESS' : 'FAILED';

    // Simulate status based on amount for easy testing
    if (transfer.amount === 400) {
      transfer.status = 'FAILED';
    } else if (transfer.amount === 200) {
      transfer.status = 'SUCCESS';
    }

    transfers.set(transfer.id, transfer);

    // Notify the requester with the result
    await notifyRequestor(
      transfer,
      transfer.status,
      !isSuccess ? 'Random transaction failure' : undefined,
    );

    console.log(
      `Transfer ${transfer.id} processed with status: ${transfer.status}`,
    );
  } catch (error: any) {
    console.error('External transfer processing failed:', error);
    transfer.status = 'FAILED';
    transfers.set(transfer.id, transfer);
    await notifyRequestor(transfer, 'FAILED', error.message);
  }
}

// Helper function to process vbank transfer
async function processVbankTransfer(transfer: Transfer) {
  try {
    const vbankConfig = BANKS.VBANK;

    // Call VBank API to process the transfer
    await axios.post(
      `${vbankConfig.url}/api/v1/transactions/transfer/external/inbound`,
      {
        ...transfer,
      },
      {
        headers: { 'X-API-Key': vbankConfig.apiKey },
      },
    );

    console.log(`VBank transfer ${transfer.id} initiated`);
  } catch (error: any) {
    console.error('VBank transfer initiation failed:', error.message);
    transfer.status = 'FAILED';
    transfers.set(transfer.id, transfer);
  }
}

// Helper function to notify the original requestor
async function notifyRequestor(
  transfer: Transfer,
  status: string,
  error?: string,
) {
  if (!transfer.callbackUrl) {
    return;
  }

  try {
    await axios.post(
      transfer.callbackUrl,
      {
        referenceId: transfer.referenceId,
        status,
        error,
        timestamp: new Date(),
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': process.env.VBANK_API_KEY,
        },
      },
    );
    console.log(
      `Notification sent to ${transfer.callbackUrl} for transfer ${transfer.id}`,
    );
  } catch (error: any) {
    console.error(
      `Failed to notify requestor at ${transfer.callbackUrl}:`,
      error.message,
    );
  }
}

// Start the service
const PORT = process.env.PORT || 5010;
app.listen(PORT, () => {
  console.log(`Mock Central Bank Service running on port ${PORT}`);
});

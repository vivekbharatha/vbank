# Mock Central Bank Service

A simulated central bank service that facilitates interbank transactions between VBank and external financial institutions. This service is built as part of the VBank demo project to showcase external bank transfers.

## Overview

This is a dummy central bank service to support the demonstration of external bank transfers - outbound and inbound.
As an independent app, it doesn't use internal local packages and is maintained explicitly in a single file.

## Features

- **Inbound Transfers API**: Processes transfers from VBank to external banks
- **Outbound Transfers API**: Processes transfers from external banks to VBank
- **Transfer Status Tracking**: Retrieves current status of any transfer
- **Receipt Acknowledgment**: Receives and processes transfer receipts
- **Authentication**: Secure API access via API key
- **Request Logging**: Comprehensive logging of all API requests with timing metrics

## API Endpoints

### Health Check
```
GET /health
```
Returns service health status and timestamp.

### Inbound Transfers (VBank to External)
```
POST /api/v1/transfers/inbound
```
Used by VBank to initiate transfers to external banks.

**Request Body**:
```json
{
  "sourceAccount": "string",
  "destinationAccount": "string",
  "amount": number,
  "sourceBankCode": "string",
  "destinationBankCode": "string",
  "callbackUrl": "string",
  "referenceId": "string"
}
```

### Outbound Transfers (External to VBank)
```
POST /api/v1/transfers/outbound
```
Used by external banks to send money to VBank accounts.

**Request Body**:
```json
{
  "sourceAccount": "string",
  "destinationAccount": "string",
  "amount": number,
  "sourceBankCode": "string",
  "destinationBankCode": "string",
  "note": "string" (optional)
}
```

### Receipt Acknowledgment
```
POST /api/v1/transfers/receipt/:transferId
```
Used by VBank to report on the status of transfers they've processed.

**Request Body**:
```json
{
  "status": "string",
  "error": "string" (optional)
}
```

### Transfer Status
```
GET /api/v1/transfers/:transferId/status
```
Retrieves the current status of a specific transfer.

## Testing Features

The service includes special behavior for testing purposes:
- A transfer amount of 200 will always result in a SUCCESS status
- A transfer amount of 400 will always result in a FAILED status
- Other amounts have a 50% chance of success

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Port number for the service | 5010 |
| `CENTRAL_BANK_API_KEY` | API key for authenticating requests | Required |
| `VBANK_API_KEY` | API key for communicating with VBank | Required |
| `VBANK_URL` | URL of the VBank API | http://localhost:3000 |

## Getting Started

### Prerequisites
- Node.js (v22+)
- npm

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file (`.env.example` for reference) with required environment variables:
```
PORT=5010
CENTRAL_BANK_API_KEY=your_api_key
VBANK_API_KEY=vbank_api_key
VBANK_URL=http://localhost:3000
```

3. Start the service:
```bash
npm run start
```

### Development

Start in development mode with hot-reloading:
```bash
npm run dev
```

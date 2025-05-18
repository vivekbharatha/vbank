# Transaction Service

The Transaction Service is a critical component of the vBank system, responsible for handling all transaction operations including internal transfers, external bank transfers, and transaction status management.

## Overview

This microservice handles the complete lifecycle of financial transactions within vBank and between vBank and external banking systems. It maintains a reliable record of all transaction states and communicates with other services via Kafka events.

## Features

- Internal money transfers between vBank accounts
- External bank transfers (outbound and inbound)
- Transaction status tracking and state management
- Transaction history and lookup by transaction ID or reference ID
- Saga pattern implementation for transaction recovery
- Integration with a mock central bank for external transfers

## API Endpoints

### Transaction Operations

| Method | Endpoint | Description | Authentication |
|--------|----------|-------------|----------------|
| POST | `/api/v1/transactions/transfer` | Initiate internal transfer between vBank accounts | JWT Required |
| POST | `/api/v1/transactions/transfer/external/outbound` | Initiate transfer from vBank to external bank | JWT Required |
| GET | `/api/v1/transactions/:transactionId` | Get transaction details by transaction ID | JWT Required |
| GET | `/api/v1/transactions/by-reference/:referenceId` | Get transaction details by reference ID | JWT Required |

### External Transaction Handlers (For Inter-Bank Communication)

| Method | Endpoint | Description | Authentication |
|--------|----------|-------------|----------------|
| POST | `/api/v1/transactions/transfer/external/receipt` | Handle receipt from external bank transfer | API Key Required |
| POST | `/api/v1/transactions/transfer/external/inbound` | Handle incoming transfer from external bank | API Key Required |

## Transaction States

Transactions follow a state machine design with the following possible states:

- `INITIATED` - Transaction has been created but no actions taken
- `DEBIT_SUCCESS` - Source account has been successfully debited
- `CREDIT_SUCCESS` - Destination account has been successfully credited
- `FAILED` - Transaction failed before completion
- `CREDIT_FAILED` - Credit operation failed after successful debit
- `DEBIT_COMPENSATE` - Compensation started for failed credit
- `COMPENSATION_SUCCESS` - Compensation completed successfully
- `COMPLETED` - Transaction completed successfully

## Getting Started

### Prerequisites

- Node.js (v22+)
- PostgreSQL database
- Redis
- Kafka message broker

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```
PORT=3003
DATABASE_URL=postgres://user:password@localhost:5432/transaction
REDIS_URL=redis://localhost:6379
KAFKA_BROKER=localhost:9092
JWT_SECRET=your-secret-key
LOG_LEVEL=info
API_KEY=your-api-key
CENTRAL_BANK_API_URL=http://localhost:5000
CENTRAL_BANK_API_KEY=central-bank-key
API_GATEWAY_URL=http://localhost:3000
```

### Installation

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build

# Start in production mode
npm start
```

## Architecture

The Transaction Service follows a clean architecture pattern with separation of concerns:

- **Controllers**: Handle HTTP requests and responses
- **Services**: Implement business logic
- **Entities**: Define data models
- **Events**: Handle Kafka message publishing and consuming
- **Routes**: Define API endpoints
- **Middlewares**: Handle cross-cutting concerns (authentication, logging, error handling)

## Event-Driven Communication

This service uses Kafka for event-driven communication with other services. Events published include:

- Transaction initiated
- Transaction state changes
- Transaction completed or failed

## Error Handling

The service implements comprehensive error handling with meaningful error messages and status codes. All errors are logged for monitoring and debugging purposes.

## Database

The service uses PostgreSQL with TypeORM for data persistence. The main entity is the `Transaction` entity which stores all transaction-related information.

## Integration

This service integrates with:
- Account Service (for account balance updates)
- Auth Service (for user verification)
- Mock Central Bank Service (for external transfers)

## Contributing

Please follow the established coding style and commit message conventions when contributing to this service.

## License

This project is licensed under the terms of the LICENSE file included in the repository.
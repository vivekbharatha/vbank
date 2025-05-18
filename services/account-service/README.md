# Account Service

The Account Service is a crucial component of the vBank system, responsible for managing user bank accounts, balance operations, and account lifecycle management.

## Overview

This microservice provides comprehensive account management capabilities within vBank, enabling users to create and manage multiple accounts, perform balance operations, and maintain a reliable record of account statuses and balances.

## Features

- Account creation and management
- Multiple account types (savings, current)
- Account status management (active, frozen, closed)
- Balance operations (credit, debit)
- Account lookup by account number
- Integration with transaction service for financial operations
- Event-driven architecture for distributed transaction handling

## API Endpoints

### Account Management

| Method | Endpoint | Description | Authentication |
|--------|----------|-------------|----------------|
| POST | `/api/v1/accounts` | Create a new bank account | JWT Required |
| GET | `/api/v1/accounts` | List all accounts for a user | JWT Required |
| GET | `/api/v1/accounts/:accountNumber` | Get details of a specific account | JWT Required |
| DELETE | `/api/v1/accounts/:accountNumber` | Close/delete an account | JWT Required |

### Balance Operations

| Method | Endpoint | Description | Authentication |
|--------|----------|-------------|----------------|
| POST | `/api/v1/accounts/internal/transaction` | Perform balance operations (credit/debit) | JWT Required |

## Account Types

The service supports multiple account types:

- `SAVINGS` - Standard savings account with basic features
- `CURRENT` - Business account with additional features

## Account States

Accounts can be in one of the following states:

- `ACTIVE` - Normal operational state
- `FROZEN` - Temporarily suspended account
- `CLOSED` - Permanently closed account

## Getting Started

### Prerequisites

- Node.js (v22+)
- PostgreSQL database
- Redis
- Kafka message broker

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```
PORT=3002
DATABASE_URL=postgres://user:password@localhost:5432/account
REDIS_URL=redis://localhost:6379
KAFKA_BROKER=localhost:9092
JWT_SECRET=your-secret-key
LOG_LEVEL=info
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

The Account Service follows a clean architecture pattern with separation of concerns:

- **Controllers**: Handle HTTP requests and responses
- **Services**: Implement business logic
- **Entities**: Define data models
- **Events**: Handle Kafka message publishing and consuming
- **Routes**: Define API endpoints
- **Middlewares**: Handle cross-cutting concerns (authentication, logging, error handling)

## Event-Driven Communication

This service uses Kafka for event-driven communication with other services. The service:

- Publishes account creation and deletion events
- Consumes transaction events to update account balances
- Implements transaction compensation logic for distributed transactions

## Error Handling

The service implements comprehensive error handling with meaningful error messages and status codes. All errors are logged for monitoring and debugging purposes.

## Database

The service uses PostgreSQL with TypeORM for data persistence. The main entity is the `Account` entity which stores all account-related information.

## Integration

This service integrates with:
- Transaction Service (for transaction processing)
- Auth Service (for user verification)

## Contributing

Please follow the established coding style and commit message conventions when contributing to this service.

## License

This project is licensed under the terms of the LICENSE file included in the repository.
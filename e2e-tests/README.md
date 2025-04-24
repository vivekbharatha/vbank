# End-to-End Tests for Private-V-Bank Microservices

This folder contains end-to-end tests for the Private-V-Bank microservices architecture, testing the complete flow across all services:

- API Gateway
- Auth Service
- Account Service

## Test Structure

The tests are organized in a sequential manner to test the entire flow:

1. **Health Checks** (`01-health-check.test.ts`): Verifies all services are running properly
2. **Authentication Flow** (`02-auth.test.ts`): Tests user registration, login, and logout
3. **Account Management** (`03-account.test.ts`): Tests account creation, listing, and deletion
4. **Transactions** (`04-transactions.test.ts`): Tests money transfers between accounts
5. **Complete Flow** (`05-complete-flow.test.ts`): Tests the entire user journey from registration to logout

## Getting Started

### Prerequisites

- Node.js (v14+)
- All microservices running locally or in Docker containers

### Setup

1. Install dependencies:

   ```
   npm install
   ```

2. Configure environment variables (optional):
   - Create a `.env` file in the e2e-tests directory with the following variables:
   ```
   API_GATEWAY_URL=http://localhost:3000
   AUTH_SERVICE_URL=http://localhost:3001
   ACCOUNT_SERVICE_URL=http://localhost:3002
   ```

### Running Tests

Run all tests in sequence:

```
npm test
```

Run a specific test file:

```
npx jest tests/01-health-check.test.ts
```

Run tests in watch mode (for development):

```
npm run test:watch
```

## Test Flow

The tests are designed to run in sequence and build on each other:

1. Health checks verify all services are operational
2. Authentication tests create a new user and get access token
3. Account tests create and manage user accounts
4. Transaction tests perform transfers between accounts
5. Complete flow test runs through the entire user journey

## Clean-up

The tests include clean-up logic in the `afterAll` hooks to remove test data where possible. However, some data like user records may remain in the database after testing.

## Adding New Tests

When adding new tests:

1. Follow the naming convention: `NN-feature-name.test.ts` where NN is a sequence number
2. Consider dependencies between tests and proper ordering
3. Use the utility functions in `utils.ts` for authentication and common operations
4. Add clean-up code to avoid polluting the database

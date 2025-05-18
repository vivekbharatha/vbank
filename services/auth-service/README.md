# Authentication Service

The Authentication Service is a fundamental component of the vBank system, responsible for user registration, authentication, and session management.

## Overview

This microservice manages user identity and access within vBank. It provides secure user registration, login capabilities, and token-based authentication using JWT (JSON Web Tokens) with Redis-backed session management.

## Features

- User registration with secure password hashing
- User authentication with JWT tokens
- Token validation and verification
- Session management with Redis
- Account security and password policies
- Event publishing for user registration

## API Endpoints

### Authentication Operations

| Method | Endpoint | Description | Authentication |
|--------|----------|-------------|----------------|
| POST | `/api/v1/auth/register` | Register a new user | Not Required |
| POST | `/api/v1/auth/login` | Authenticate and get access token | Not Required |
| POST | `/api/v1/auth/logout` | Invalidate the current session | JWT Required |

## Data Models

### User

- `id` - Unique identifier
- `firstName` - User's first name
- `lastName` - User's last name
- `email` - User's email address (unique)
- `createdAt` - Account creation timestamp
- `updatedAt` - Account update timestamp

### Credential

- `id` - Unique identifier
- `email` - User's email address (unique)
- `passwordHash` - Securely hashed password
- `userId` - Reference to associated user
- `createdAt` - Credential creation timestamp
- `updatedAt` - Credential update timestamp

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- PostgreSQL database
- Redis
- Kafka message broker

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```
PORT=3001
DATABASE_URL=postgres://user:password@localhost:5432/auth
REDIS_URL=redis://localhost:6379
KAFKA_BROKER=localhost:9092
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h
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

The Authentication Service follows a clean architecture pattern with separation of concerns:

- **Controllers**: Handle HTTP requests and responses
- **Services**: Implement business logic
- **Entities**: Define data models
- **Events**: Handle Kafka message publishing
- **Routes**: Define API endpoints
- **Middlewares**: Handle cross-cutting concerns (authentication, logging, error handling)

## Security

The service implements several security features:

- Password hashing with bcrypt
- JWT for secure authentication
- Redis for token invalidation (logout)
- CORS configuration
- Helmet.js for HTTP security headers

## Event-Driven Communication

This service uses Kafka for event-driven communication with other services:

- Publishes user registration events for account creation

## Error Handling

The service implements comprehensive error handling with meaningful error messages and status codes. All errors are logged for monitoring and debugging purposes.

## Database

The service uses PostgreSQL with TypeORM for data persistence. The main entities are:
- `User` - Stores user profile information
- `Credential` - Stores authentication-related information

## Integration

This service integrates with:
- Account Service (for account creation after registration)
- Transaction Service (for user verification)

## Contributing

Please follow the established coding style and commit message conventions when contributing to this service.

## License

This project is licensed under the terms of the LICENSE file included in the repository.

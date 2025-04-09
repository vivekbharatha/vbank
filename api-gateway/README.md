# API Gateway Service

This is the API Gateway service for the vBank microservices architecture. It serves as the entry point for all client requests, handling routing, authentication, rate limiting, and request forwarding to appropriate microservices.

## Features

- Request routing and load balancing
- Authentication and authorization
- Rate limiting
- Request/Response transformation
- CORS support
- Security headers (Helmet)
- Request timeout handling
- Logging (Winston)
- Redis integration for auth

## Prerequisites

- Node.js (v22 or higher)
- Redis server
- Access to other microservices (Auth, Accounts, Transaction services)

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file:
```bash
cp .env.example .env
```

3. Update the `.env` file with your configuration values

## Environment Variables

| Variable                | Description                              | Default                |
| ----------------------- | ---------------------------------------- | ---------------------- |
| PORT                    | Server port                              | 3000                   |
| NODE_ENV                | Environment (development/production)     | development            |
| AUTH_JWT_SECRET         | Secret for auth service JWT verification | -                      |
| GATEWAY_JWT_SECRET      | Secret for gateway JWT generation        | -                      |
| GATEWAY_JWT_EXPIRES_IN  | Gateway JWT expiration time              | 1m                     |
| RATE_LIMIT_WINDOW       | Rate limit window in minutes             | 15                     |
| RATE_LIMIT_MAX_REQUESTS | Maximum requests per window              | 100                    |
| DEFAULT_TIMEOUT         | Default request timeout in ms            | 30000                  |
| LOG_LEVEL               | Logging level                            | debug                  |
| REDIS_URL               | Redis connection URL                     | redis://localhost:6379 |
| AUTH_SERVICE_URL        | Auth service URL                         | http://localhost:3001  |
| ACCOUNTS_SERVICE_URL    | Accounts service URL                     | http://localhost:3002  |
| TRANSACTION_SERVICE_URL | Transaction service URL                  | http://localhost:3003  |

## Available Scripts

- `npm start` - Start the production server
- `npm run dev` - Start the development server with hot-reload
- `npm run build` - Build the TypeScript code
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm test` - Run tests

## Architecture

The API Gateway acts as a reverse proxy, forwarding requests to the appropriate microservices based on the route. It implements several middleware layers:

1. Security (Helmet, CORS)
2. Rate Limiting
3. Authentication
4. Request Routing
5. Error Handling
6. Logging

## Dependencies

### Production Dependencies
- express: Web framework
- cors: Cross-origin resource sharing
- helmet: Security headers
- express-rate-limit: Rate limiting
- http-proxy-middleware: Request proxying
- ioredis: Redis client
- jsonwebtoken: JWT handling
- winston: Logging
- dotenv: Environment variables

### Development Dependencies
- TypeScript
- ESLint & Prettier for code quality
- ts-node & ts-node-dev for development
- Jest for testing

## Security

The API Gateway implements several security measures:
- CORS protection
- Rate limiting to prevent abuse
- Security headers via Helmet
- JWT-based authentication
- Request timeout protection

## License

This project is licensed under the MIT License. 
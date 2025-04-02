# VBANK - Microservices Masterclass

NOTE: This is still in WIP (Work In Progress)

A banking application built with microservices architecture.

## 🚀 Services Overview

PLACEHOLDER FOR ARCHITECTURE DIAGRAM

### Core Services

| Service Name        | Port | Description                    |
| ------------------- | ---- | ------------------------------ |
| API Gateway         | 3000 | Entry point for all requests   |
| Auth Service        | 3001 | Authentication & authorization |
| Account Service     | 3002 | Account management             |
| Transaction Service | 3003 | Transaction processing         |

### Supporting Services

| Service Name | Port | Description                |
| ------------ | ---- | -------------------------- |
| Redis        | 6379 | Cache & session management |
| Redis UI     | 8001 | Redis management interface |

## 🛠️ Tech Stack

- Node.js
- TypeScript
- Express.js
- Redis
- Microservices Architecture

## 🚦 Getting Started

1. Clone the repository
2. Install dependencies for each service
3. Start Redis via docker-compose.yml file
4. Start individual services
5. Access the API through the gateway at `localhost:3000`

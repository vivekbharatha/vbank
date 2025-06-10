FROM node:22-alpine AS builder

WORKDIR /workspace

COPY packages ./packages

RUN npm install tsc -g

WORKDIR /workspace/packages/constants
RUN npm install && npm run build

WORKDIR /workspace/packages/logger
RUN npm install && npm run build

WORKDIR /workspace/packages/kafka-client
RUN npm install && npm run build

WORKDIR /workspace/packages/redis-client
RUN npm install && npm run build

WORKDIR /workspace

COPY services/transaction-service/package*.json ./services/transaction-service/

WORKDIR /workspace/services/transaction-service
RUN npm install

COPY services/transaction-service/package*.json ./
COPY services/transaction-service/tsconfig.json ./
COPY services/transaction-service/src ./src
COPY services/transaction-service/.prettierrc ./
COPY services/transaction-service/eslint.config.js ./

RUN npm run build

# ------------------------------------------------------------

# Production stage
FROM node:22-alpine

WORKDIR /workspace

# Copy built assets from builder
COPY --from=builder /workspace/packages ./packages
COPY --from=builder /workspace/services/transaction-service/dist ./services/transaction-service/dist
COPY --from=builder /workspace/services/transaction-service/package*.json ./services/transaction-service/

WORKDIR /workspace/services/transaction-service

ENV NODE_ENV=production

RUN npm ci

EXPOSE 3000

CMD ["node", "dist/app.js"] 
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

COPY services/account-service/package*.json ./services/account-service/

WORKDIR /workspace/services/account-service
RUN npm install

COPY services/account-service/package*.json ./
COPY services/account-service/tsconfig.json ./
COPY services/account-service/src ./src
COPY services/account-service/.prettierrc ./
COPY services/account-service/eslint.config.js ./

RUN npm run build

# ------------------------------------------------------------

# Production stage
FROM node:22-alpine

WORKDIR /workspace

# Copy built assets from builder
COPY --from=builder /workspace/packages ./packages
COPY --from=builder /workspace/services/account-service/dist ./services/account-service/dist
COPY --from=builder /workspace/services/account-service/package*.json ./services/account-service/

WORKDIR /workspace/services/account-service

ENV NODE_ENV=production

RUN npm ci

EXPOSE 3000

CMD ["node", "dist/app.js"] 
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

COPY services/api-gateway/package*.json ./services/api-gateway/

WORKDIR /workspace/services/api-gateway
RUN npm install

COPY services/api-gateway/package*.json ./
COPY services/api-gateway/tsconfig.json ./
COPY services/api-gateway/src ./src
COPY services/api-gateway/.prettierrc ./
COPY services/api-gateway/eslint.config.js ./

RUN npm run build

# ------------------------------------------------------------

# Production stage
FROM node:22-alpine

WORKDIR /workspace

# Copy built assets from builder
COPY --from=builder /workspace/packages ./packages
COPY --from=builder /workspace/services/api-gateway/dist ./services/api-gateway/dist
COPY --from=builder /workspace/services/api-gateway/package*.json ./services/api-gateway/

WORKDIR /workspace/services/api-gateway

ENV NODE_ENV=production

RUN npm ci

EXPOSE 3000

CMD ["node", "dist/app.js"] 
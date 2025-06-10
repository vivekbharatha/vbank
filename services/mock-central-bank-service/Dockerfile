FROM node:22-alpine AS builder

WORKDIR /workspace

COPY services/mock-central-bank-service/package*.json ./mock-central-bank-service/

WORKDIR /workspace/mock-central-bank-service
RUN npm install

COPY services/mock-central-bank-service/package*.json ./
COPY services/mock-central-bank-service/tsconfig.json ./
COPY services/mock-central-bank-service/src ./src
COPY services/mock-central-bank-service/.prettierrc ./
COPY services/mock-central-bank-service/eslint.config.js ./

RUN npm run build

# ------------------------------------------------------------

# Production stage
FROM node:22-alpine

WORKDIR /workspace

# Copy built assets from builder
COPY --from=builder /workspace/mock-central-bank-service/dist ./mock-central-bank-service/dist
COPY --from=builder /workspace/mock-central-bank-service/package*.json ./mock-central-bank-service/

WORKDIR /workspace/mock-central-bank-service

ENV NODE_ENV=production

RUN npm ci

EXPOSE 3000

CMD ["node", "dist/index.js"] 
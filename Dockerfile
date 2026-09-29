# Production Dockerfile for ReturnPath with SAP HANA Cloud support
FROM node:20-slim AS builder

WORKDIR /app

# Install build dependencies
COPY package*.json ./
RUN npm ci

# Copy source and build frontend
COPY . .
RUN npm run build

# Production runtime stage
FROM node:20-slim AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

# Install production dependencies (including native @sap/hana-client)
COPY package*.json ./
RUN npm ci --omit=dev

# Copy built frontend and server files
COPY --from=builder /app/dist ./dist
COPY server.ts ./
COPY server-hana.ts ./
COPY tsconfig.json ./

EXPOSE 3000

CMD ["npx", "tsx", "server.ts"]

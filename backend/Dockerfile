# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json ./
COPY prisma ./prisma/

RUN npm install

COPY tsconfig.json ./
COPY src ./src

RUN npx prisma generate
RUN npm run build
RUN npx tsc prisma/seed.ts --esModuleInterop --module CommonJS --outDir dist/prisma

# Stage 2: Production Run
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY package.json ./
COPY prisma ./prisma/

RUN npm install --omit=dev

COPY --from=builder /app/dist ./dist
RUN npx prisma generate

EXPOSE 5000

CMD ["node", "dist/server.js"]

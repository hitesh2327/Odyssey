# Stage 1
FROM node:20-alpine AS builder

RUN apk add --no-cache openssl

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

COPY . .

RUN npx prisma generate
RUN npm run build

RUN npx tsc prisma/seed.ts \
    --esModuleInterop \
    --module CommonJS \
    --outDir dist/prisma


# Stage 2
FROM node:20-alpine AS runner

RUN apk add --no-cache openssl

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./

# copy ALL node_modules from builder
COPY --from=builder /app/node_modules ./node_modules

COPY prisma ./prisma/

COPY --from=builder /app/dist ./dist

EXPOSE 5000

CMD ["node", "dist/server.js"]
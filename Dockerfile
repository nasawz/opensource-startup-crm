# syntax=docker/dockerfile:1

FROM node:22-alpine AS builder
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@latest --activate
RUN npm config set registry https://registry.npmmirror.com
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --config.registry=https://registry.npmmirror.com
COPY . .
RUN npx prisma generate && pnpm run build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-lock.yaml ./
COPY --from=builder /app/build ./build
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/server.js ./
COPY --from=builder /app/api ./api
RUN mkdir -p /app/data
EXPOSE 3000 3002
CMD ["node", "server.js"]

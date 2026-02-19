# Build stage
FROM node:22-alpine AS build
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10.6.2 --activate
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY src/ src/
COPY tsconfig.json ./
RUN pnpm run build

# Production stage
FROM node:22-alpine
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10.6.2 --activate
RUN addgroup -g 1001 appgroup && adduser -u 1001 -G appgroup -D appuser
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod
COPY --from=build /app/dist/ dist/
COPY plugins/ plugins/
RUN chown -R appuser:appgroup /app
USER appuser
ENV PORT=3000
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3000/health || exit 1
CMD ["node", "dist/index.js"]

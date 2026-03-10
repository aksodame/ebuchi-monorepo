FROM node:24-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

# Install all dependencies (dev included for building)
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/typescript-config/package.json packages/typescript-config/
COPY packages/eslint-config/package.json packages/eslint-config/
COPY apps/server/package.json apps/server/
RUN pnpm install --frozen-lockfile

# Build the server
FROM deps AS builder
COPY packages/ packages/
COPY apps/server/src apps/server/src
COPY apps/server/nest-cli.json apps/server/tsconfig.json apps/server/tsconfig.build.json apps/server/
RUN pnpm --filter @ebuchi-monorepo/server build

# Production image: reinstall only prod deps, copy dist
FROM base AS runner
ENV NODE_ENV=production
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/typescript-config/package.json packages/typescript-config/
COPY packages/eslint-config/package.json packages/eslint-config/
COPY apps/server/package.json apps/server/
RUN pnpm install --frozen-lockfile --prod
COPY --from=builder /app/apps/server/dist apps/server/dist
CMD ["node", "apps/server/dist/main"]

<div align="center">
  <img src="./mascot.png" width="128" height="128" alt="ebuchi mascot" />
  <h1>ebuchi-monorepo</h1>
  <p>pnpm + Turborepo monorepo containing the ebuchi Discord bot server and shared packages.</p>
</div>

---

## Tech Stack

<div align="center">

**Runtime & Language**

<img src="https://skillicons.dev/icons?i=nodejs,typescript" />

**Framework & Bot**

<img src="https://skillicons.dev/icons?i=nestjs" />
<img src="https://img.shields.io/badge/discord.js-5865F2?style=flat-square&logo=discord&logoColor=white" height="48" />
<img src="https://img.shields.io/badge/necord-5865F2?style=flat-square&logo=discord&logoColor=white" height="48" />

**Infrastructure**

<img src="https://skillicons.dev/icons?i=redis,docker,prometheus,grafana" />
<img src="https://img.shields.io/badge/Lavalink-FF0000?style=flat-square&logo=audiomack&logoColor=white" height="48" />
<img src="https://img.shields.io/badge/GlitchTip-6C5CE7?style=flat-square&logo=sentry&logoColor=white" height="48" />

**Monorepo**

<img src="https://skillicons.dev/icons?i=pnpm" />
<img src="https://img.shields.io/badge/Turborepo-EF4444?style=flat-square&logo=turborepo&logoColor=white" height="48" />

</div>

---

## Structure

```
apps/
  server/             # NestJS app — Discord bot + HTTP API
packages/
  eslint-config/      # Shared ESLint config
  typescript-config/  # Shared TypeScript config
infra/
  redis/              # Redis docker-compose
  lavalink/           # Lavalink docker-compose + config
  prometheus/         # Prometheus docker-compose + config
  grafana/            # Grafana docker-compose + dashboards
  glitchtip/          # GlitchTip docker-compose
scripts/
  deploy.sh           # VPS deployment script
  reload-env.sh       # Sync .env to VPS and restart all containers
```

## Prerequisites

- Node.js 24+
- pnpm 9
- Docker + Docker Compose

## Setup

**1. Install dependencies**

```bash
pnpm install
```

**2. Configure environment**

```bash
cp .env.example .env
```

Fill in all required values in `.env`. See [Environment Variables](#environment-variables) below.

**3. Start infrastructure**

```bash
docker compose up -d
```

This starts Redis, Lavalink, Prometheus, Grafana, and GlitchTip.

**4. Run the server**

```bash
pnpm dev
```

## Environment Variables

| Variable | Description |
|---|---|
| `PORT` | HTTP server port (default `8080`) |
| `INTERNAL_API_KEY` | Bearer token for `/health` and `/metrics` endpoints |
| `SENTRY_DSN` | Sentry DSN for error tracking |
| `REDIS_HOST` | Redis hostname |
| `REDIS_PORT` | Redis port |
| `PROMETHEUS_PORT` | Prometheus port |
| `GRAFANA_PORT` | Grafana port |
| `GRAFANA_PASSWORD` | Grafana admin password |
| `GLITCHTIP_PORT` | GlitchTip port |
| `GLITCHTIP_SECRET_KEY` | GlitchTip secret key |
| `GLITCHTIP_DOMAIN` | GlitchTip public URL |
| `DISCORD_BOT_TOKEN` | Discord bot token |
| `DISCORD_DEV_GUILD_ID` | Guild ID for dev slash command registration (leave empty for global) |
| `LAVALINK_HOST` | Lavalink hostname |
| `LAVALINK_PORT` | Lavalink port |
| `LAVALINK_PASSWORD` | Lavalink server password (must match `infra/lavalink/application.yml`) |

## Scripts

```bash
pnpm dev                # Run all apps in watch mode
pnpm build              # Build all apps
pnpm lint               # Lint all apps
pnpm deploy             # Build image and deploy to VPS
pnpm deploy:setup       # Full deploy: sync env + firewall + infra + deploy
pnpm deploy:reload-env  # Sync .env to VPS and restart all containers (no image rebuild)
```

## Deployment

See [apps/server/README.md](apps/server/README.md#deployment).

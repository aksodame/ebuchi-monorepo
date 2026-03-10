<div align="center">
  <img src="../../mascot.png" width="128" height="128" alt="ebuchi mascot" />
  <h1>@ebuchi-monorepo/server</h1>
  <p>NestJS application combining a Discord music bot and an HTTP API.</p>
</div>

---

## Tech Stack

<div align="center">

<img src="https://skillicons.dev/icons?i=nodejs,typescript,nestjs" />
<img src="https://img.shields.io/badge/discord.js-5865F2?style=flat-square&logo=discord&logoColor=white" height="48" />
<img src="https://img.shields.io/badge/necord-5865F2?style=flat-square&logo=discord&logoColor=white" height="48" />
<img src="https://img.shields.io/badge/Lavalink-FF0000?style=flat-square&logo=audiomack&logoColor=white" height="48" />
<img src="https://skillicons.dev/icons?i=redis" />

</div>

---

## Features

- Discord slash commands via [necord](https://necord.org)
- Music playback via [lavalink-client](https://github.com/tomato6966/lavalink-client) (SoundCloud search)
- Redis-backed queue persistence
- Auto-disconnect when alone in voice channel
- Health check endpoint (`/health`)
- Prometheus metrics endpoint (`/metrics`)
- Sentry error tracking

## Architecture

```
src/
  common/
    exception/        # Global exception filter + handler registry
  discord/
    common/
      decorators/     # VoiceChannelId param decorator
      guards/         # GuildGuard
      interceptors/   # DeferReplyInterceptor
    music/
      guards/         # LavalinkReadyGuard, ActivePlayerGuard, ActiveTrackGuard
      dto/            # Slash command option DTOs
      music.commands.ts
      music.service.ts
      music.embeds.ts
      music-events.service.ts
    discord-host.handler.ts   # Routes exceptions to Discord embeds
  infra/
    redis/            # RedisService (ioredis)
    lavalink/         # LavalinkService + RedisQueueStore
    health-check/     # /health endpoint
```

## Development

```bash
pnpm dev       # watch mode
pnpm build     # production build
pnpm lint      # lint
```

## Deployment

Deployment is handled by `scripts/deploy.sh` from the repo root. It builds a Docker image locally, streams it to the VPS via SSH, and restarts the container.

### First-time setup

**1. Configure deploy settings**

```bash
cp scripts/deploy.env.example scripts/deploy.env
```

Fill in your VPS connection details and adjust defaults as needed.

| Variable | Description |
|---|---|
| `VPS_HOST` | VPS IP or hostname |
| `VPS_USER` | SSH user |
| `SSH_PORT` | SSH port (default `22`) |
| `SSH_KEY` | Path to private key (or leave unset to use SSH agent) |
| `IMAGE_NAME` | Docker image name (default `ebuchi-server`) |
| `IMAGE_TAG` | Docker image tag (default `latest`) |
| `CONTAINER_NAME` | Container name on VPS (default `ebuchi-server`) |
| `REMOTE_ENV_FILE` | Path to `.env` on VPS (default `/opt/ebuchi/.env`) |
| `PLATFORM` | Target platform (default `linux/amd64`, use `linux/arm64` for ARM VPS) |
| `FIREWALL_PORTS` | Env var names whose ports UFW should open (e.g. `PORT,GRAFANA_PORT,GLITCHTIP_PORT`) |

**2. Push the env file**

```bash
./scripts/deploy.sh --sync-env
```

This copies the repo root `.env` to `REMOTE_ENV_FILE` on the VPS.

**3. Open firewall ports**

```bash
./scripts/deploy.sh --setup-firewall
```

Resolves port numbers from `.env` by the variable names listed in `FIREWALL_PORTS`, then applies UFW rules on the VPS. SSH port is always allowed first.

**4. Start infrastructure services**

```bash
./scripts/deploy.sh --setup-infra
```

Syncs `docker-compose.yml` and the `infra/` directory to the VPS, then runs `docker compose pull && docker compose up -d` to start Redis, Lavalink, Prometheus, Grafana, and GlitchTip.

**5. Deploy**

```bash
./scripts/deploy.sh
```

Or run all steps at once:

```bash
pnpm deploy:setup
```

### Redeployment

```bash
./scripts/deploy.sh                                           # redeploy only
./scripts/deploy.sh --sync-env                                # push updated .env then redeploy
./scripts/deploy.sh --setup-firewall                          # reapply UFW rules then redeploy
./scripts/deploy.sh --setup-infra                             # re-sync infra files then redeploy
./scripts/deploy.sh --sync-env --setup-firewall --setup-infra # all steps
pnpm deploy:setup                                             # all steps (shortcut)
pnpm deploy                                                   # redeploy only (shortcut)
```

### Reload env without rebuilding

Use this when you only changed `.env` on the local machine and want to push it to the VPS and restart everything without rebuilding or re-transferring the Docker image.

```bash
pnpm deploy:reload-env
# or directly:
./scripts/reload-env.sh
```

This syncs `.env` to the VPS, force-recreates all infra containers (so they pick up new env), and restarts the app container with the existing image.

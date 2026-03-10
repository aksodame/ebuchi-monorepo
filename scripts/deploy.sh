#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

# Parse flags
SYNC_ENV=false
SETUP_FIREWALL=false
SETUP_INFRA=false
MIGRATE_GLITCHTIP=false
for arg in "$@"; do
  case "$arg" in
    --sync-env) SYNC_ENV=true ;;
    --setup-firewall) SETUP_FIREWALL=true ;;
    --setup-infra) SETUP_INFRA=true ;;
    --migrate-glitchtip) MIGRATE_GLITCHTIP=true ;;
    *) echo "Unknown argument: $arg"; exit 1 ;;
  esac
done

CONFIG_FILE="${SCRIPT_DIR}/deploy.env"
if [[ ! -f "${CONFIG_FILE}" ]]; then
  echo "Error: scripts/deploy.env not found. Copy scripts/deploy.env.example and configure it."
  exit 1
fi

# shellcheck source=/dev/null
source "${CONFIG_FILE}"

: "${VPS_HOST:?VPS_HOST is required in deploy.env}"
: "${VPS_USER:?VPS_USER is required in deploy.env}"

IMAGE_NAME="${IMAGE_NAME:-ebuchi-server}"
IMAGE_TAG="${IMAGE_TAG:-latest}"
CONTAINER_NAME="${CONTAINER_NAME:-ebuchi-server}"
REMOTE_ENV_FILE="${REMOTE_ENV_FILE:-/opt/ebuchi/.env}"
REMOTE_DIR="${REMOTE_DIR:-/opt/ebuchi}"
SSH_PORT="${SSH_PORT:-22}"
PLATFORM="${PLATFORM:-linux/amd64}"

SSH_TARGET="${VPS_USER}@${VPS_HOST}"

# --- Open a single reusable SSH ControlMaster session ---
CONTROL_SOCKET="$(mktemp -u /tmp/ssh-ebuchi-XXXXXX.sock)"

AUTH_OPTS=()
if [[ -n "${SSH_KEY:-}" ]]; then
  AUTH_OPTS+=(-i "${SSH_KEY}")
fi

# Master: opens the persistent background connection
SSH_MASTER_OPTS=(
  -o StrictHostKeyChecking=no
  -p "${SSH_PORT}"
  -o ControlMaster=yes
  -o ControlPath="${CONTROL_SOCKET}"
  -o ControlPersist=yes
  "${AUTH_OPTS[@]+"${AUTH_OPTS[@]}"}"
)

# Reuse opts: all subsequent ssh/scp calls share the socket
SSH_OPTS=(
  -o StrictHostKeyChecking=no
  -p "${SSH_PORT}"
  -o ControlMaster=no
  -o ControlPath="${CONTROL_SOCKET}"
)
SCP_OPTS=(
  -o StrictHostKeyChecking=no
  -P "${SSH_PORT}"
  -o ControlMaster=no
  -o ControlPath="${CONTROL_SOCKET}"
)

echo "🔗 Connecting to ${SSH_TARGET}..."
ssh "${SSH_MASTER_OPTS[@]}" -N -f "${SSH_TARGET}"

cleanup() {
  ssh -o ControlPath="${CONTROL_SOCKET}" -O exit "${SSH_TARGET}" 2>/dev/null || true
}
trap cleanup EXIT

# --- Preflight: check VPS dependencies ---
echo "🔍 Checking VPS dependencies..."
ssh "${SSH_OPTS[@]}" "${SSH_TARGET}" bash << 'PREFLIGHT'
  missing=()
  for dep in docker gzip; do
    if ! command -v "$dep" &> /dev/null; then
      missing+=("$dep")
    fi
  done
  if [[ ${#missing[@]} -gt 0 ]]; then
    echo "Missing: ${missing[*]}"
    exit 1
  fi
  echo "  🐳 docker $(docker --version)"
PREFLIGHT
echo "  ✅ All dependencies satisfied"

# --- Step: sync env ---
if [[ "${SYNC_ENV}" == true ]]; then
  if [[ ! -f "${ROOT_DIR}/.env" ]]; then
    echo "❌ Error: .env not found at repo root"
    exit 1
  fi
  echo "📄 Syncing env file to VPS (${REMOTE_ENV_FILE})..."
  ssh "${SSH_OPTS[@]}" "${SSH_TARGET}" "mkdir -p $(dirname "${REMOTE_ENV_FILE}")"
  scp "${SCP_OPTS[@]}" "${ROOT_DIR}/.env" "${SSH_TARGET}:${REMOTE_ENV_FILE}"
  echo "  ✅ Env file synced"
fi

# --- Step: setup firewall ---
if [[ "${SETUP_FIREWALL}" == true ]]; then
  : "${FIREWALL_PORTS:?FIREWALL_PORTS is required in deploy.env when using --setup-firewall (e.g. PORT,GRAFANA_PORT,GLITCHTIP_PORT)}"

  ENV_SOURCE="${ROOT_DIR}/.env"
  if [[ ! -f "${ENV_SOURCE}" ]]; then
    ENV_SOURCE="${ROOT_DIR}/.env.example"
    echo "⚠️  .env not found, reading port values from .env.example"
  fi

  echo "🛡️  Resolving firewall ports..."
  IFS=',' read -ra PORT_KEYS <<< "${FIREWALL_PORTS}"
  RESOLVED_PORTS=()
  for key in "${PORT_KEYS[@]}"; do
    value="$(grep -E "^${key}=" "${ENV_SOURCE}" | head -1 | cut -d'=' -f2 | tr -d '[:space:]')"
    if [[ -z "${value}" || ! "${value}" =~ ^[0-9]+$ ]]; then
      echo "❌ Error: could not resolve ${key} to a valid port number in ${ENV_SOURCE}"
      exit 1
    fi
    RESOLVED_PORTS+=("${value}")
    echo "  🔓 ${key}=${value}"
  done

  echo "🛡️  Configuring UFW on VPS..."
  ssh "${SSH_OPTS[@]}" "${SSH_TARGET}" bash << EOF
    set -euo pipefail

    ufw allow "${SSH_PORT}/tcp" > /dev/null
    echo "  🔑 Allowed SSH on port ${SSH_PORT}"

    for port in ${RESOLVED_PORTS[*]}; do
      ufw allow "\${port}/tcp" > /dev/null
      echo "  🔓 Allowed \${port}/tcp"
    done

    ufw --force enable > /dev/null
    echo ""
    ufw status numbered
EOF
  echo "  ✅ Firewall configured"
fi

# --- Step: setup infra ---
if [[ "${SETUP_INFRA}" == true ]]; then
  if [[ ! -f "${ROOT_DIR}/.env" ]]; then
    echo "❌ Error: .env not found at repo root (required for docker compose)"
    exit 1
  fi

  echo "📦 Syncing infra files to VPS (${REMOTE_DIR})..."
  ssh "${SSH_OPTS[@]}" "${SSH_TARGET}" "mkdir -p '${REMOTE_DIR}'"
  scp "${SCP_OPTS[@]}" "${ROOT_DIR}/docker-compose.yml" "${SSH_TARGET}:${REMOTE_DIR}/docker-compose.yml"
  scp "${SCP_OPTS[@]}" -r "${ROOT_DIR}/infra" "${SSH_TARGET}:${REMOTE_DIR}/infra"
  scp "${SCP_OPTS[@]}" "${ROOT_DIR}/.env" "${SSH_TARGET}:${REMOTE_DIR}/.env"

  echo "🚀 Starting infra services..."
  ssh "${SSH_OPTS[@]}" "${SSH_TARGET}" bash << EOF
    set -euo pipefail
    cd "${REMOTE_DIR}"
    docker compose pull --quiet
    docker compose up -d
    echo ""
    docker compose ps
EOF
  echo "  ✅ Infra services started"

  MIGRATE_GLITCHTIP=true
fi

# --- Step: migrate glitchtip ---
if [[ "${MIGRATE_GLITCHTIP}" == true ]]; then
  echo "🗄️  Running GlitchTip migrations..."
  ssh "${SSH_OPTS[@]}" "${SSH_TARGET}" bash << EOF
    set -euo pipefail
    cd "${REMOTE_DIR}"
    docker compose --profile migrate run --rm glitchtip-migrate
EOF
  echo "  ✅ GlitchTip migrations complete"
fi

# --- Step: build ---
echo "🔨 Building ${IMAGE_NAME}:${IMAGE_TAG} (${PLATFORM})..."
docker buildx build \
  --platform "${PLATFORM}" \
  --tag "${IMAGE_NAME}:${IMAGE_TAG}" \
  --file "${ROOT_DIR}/apps/server/Dockerfile" \
  --load \
  "${ROOT_DIR}"
echo "  ✅ Image built"

# --- Step: transfer ---
echo "📡 Transferring image to VPS..."
docker save "${IMAGE_NAME}:${IMAGE_TAG}" | gzip | \
  ssh "${SSH_OPTS[@]}" "${SSH_TARGET}" "docker load"
echo "  ✅ Image transferred"

# --- Step: redeploy ---
echo "♻️  Redeploying container..."
ssh "${SSH_OPTS[@]}" "${SSH_TARGET}" bash << EOF
  set -euo pipefail

  if docker ps -a --format '{{.Names}}' | grep -qx "${CONTAINER_NAME}"; then
    echo "  🛑 Stopping existing container..."
    docker stop "${CONTAINER_NAME}" > /dev/null
    docker rm "${CONTAINER_NAME}" > /dev/null
  fi

  docker run -d \
    --name "${CONTAINER_NAME}" \
    --restart unless-stopped \
    --network host \
    --env-file "${REMOTE_ENV_FILE}" \
    "${IMAGE_NAME}:${IMAGE_TAG}"

  echo "  📊 Status: \$(docker inspect --format='{{.State.Status}}' "${CONTAINER_NAME}")"

  docker image prune -f > /dev/null
EOF

echo ""
echo "🎉 Deploy complete"

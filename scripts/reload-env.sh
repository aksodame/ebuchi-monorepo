#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

CONFIG_FILE="${SCRIPT_DIR}/deploy.env"
if [[ ! -f "${CONFIG_FILE}" ]]; then
  echo "Error: scripts/deploy.env not found. Copy scripts/deploy.env.example and configure it."
  exit 1
fi

# shellcheck source=/dev/null
source "${CONFIG_FILE}"

: "${VPS_HOST:?VPS_HOST is required in deploy.env}"
: "${VPS_USER:?VPS_USER is required in deploy.env}"

if [[ ! -f "${ROOT_DIR}/.env" ]]; then
  echo "❌ Error: .env not found at repo root"
  exit 1
fi

IMAGE_NAME="${IMAGE_NAME:-ebuchi-server}"
IMAGE_TAG="${IMAGE_TAG:-latest}"
CONTAINER_NAME="${CONTAINER_NAME:-ebuchi-server}"
REMOTE_ENV_FILE="${REMOTE_ENV_FILE:-/opt/ebuchi/.env}"
REMOTE_DIR="${REMOTE_DIR:-/opt/ebuchi}"
SSH_PORT="${SSH_PORT:-22}"

SSH_TARGET="${VPS_USER}@${VPS_HOST}"

# --- Open a single reusable SSH ControlMaster session ---
CONTROL_SOCKET="$(mktemp -u /tmp/ssh-ebuchi-XXXXXX.sock)"

AUTH_OPTS=()
if [[ -n "${SSH_KEY:-}" ]]; then
  AUTH_OPTS+=(-i "${SSH_KEY}")
fi

SSH_MASTER_OPTS=(
  -o StrictHostKeyChecking=no
  -p "${SSH_PORT}"
  -o ControlMaster=yes
  -o ControlPath="${CONTROL_SOCKET}"
  -o ControlPersist=yes
  "${AUTH_OPTS[@]+"${AUTH_OPTS[@]}"}"
)

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

# --- Step: sync env ---
echo "📄 Syncing env file to VPS (${REMOTE_ENV_FILE})..."
scp "${SCP_OPTS[@]}" "${ROOT_DIR}/.env" "${SSH_TARGET}:${REMOTE_ENV_FILE}"
echo "  ✅ Env file synced"

# --- Step: restart infra containers with new env ---
echo "♻️  Restarting infra containers..."
ssh "${SSH_OPTS[@]}" "${SSH_TARGET}" bash << EOF
  set -euo pipefail
  cd "${REMOTE_DIR}"
  docker compose up -d --force-recreate
EOF
echo "  ✅ Infra containers restarted"

# --- Step: restart app container with new env ---
echo "♻️  Restarting app container..."
ssh "${SSH_OPTS[@]}" "${SSH_TARGET}" bash << EOF
  set -euo pipefail

  if docker ps -a --format '{{.Names}}' | grep -qx "${CONTAINER_NAME}"; then
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
EOF
echo "  ✅ App container restarted"

echo ""
echo "🎉 Env reloaded"

#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

PROJECT_NAME="${COMPOSE_PROJECT_NAME:-$(basename "$ROOT_DIR" | tr '[:upper:]' '[:lower:]' | tr -c 'a-z0-9_' '_')}"
APP_PORT="${APP_PORT:-7000}"
APP_BIND="${APP_BIND:-127.0.0.1}"
APP_URL="http://localhost:${APP_PORT}"

compose() {
  docker compose "$@"
}

usage() {
  cat <<EOF
Odysseus local launcher

Usage:
  ./odysseus-local.sh start          Build if needed and start Odysseus stack
  ./odysseus-local.sh fast           Start without rebuilding
  ./odysseus-local.sh stop           Stop containers
  ./odysseus-local.sh restart        Restart the stack
  ./odysseus-local.sh status         Show container status
  ./odysseus-local.sh logs           Follow Odysseus logs
  ./odysseus-local.sh password       Show the generated temporary admin password, if still in logs
  ./odysseus-local.sh url            Print the local URL
  ./odysseus-local.sh install-autostart
                                  Install a systemd service that starts this stack at boot
  ./odysseus-local.sh uninstall-autostart
                                  Remove that systemd service

Open:
  ${APP_URL}
EOF
}

require_docker() {
  if ! command -v docker >/dev/null 2>&1; then
    echo "Docker is not installed or not in PATH." >&2
    exit 1
  fi
  if ! docker compose version >/dev/null 2>&1; then
    echo "Docker Compose v2 is not available. Install the Docker compose plugin." >&2
    exit 1
  fi
}

ensure_env() {
  if [ ! -f .env ] && [ -f .env.example ]; then
    cp .env.example .env
    echo "Created .env from .env.example"
  fi
  mkdir -p data logs data/ssh data/huggingface data/local
}

print_url() {
  echo "Odysseus: ${APP_URL}"
  echo "Bind: ${APP_BIND}:${APP_PORT}"
}

wait_for_app() {
  local attempts=40
  local url="http://127.0.0.1:${APP_PORT}/api/version"

  printf "Waiting for Odysseus"
  for _ in $(seq 1 "$attempts"); do
    if command -v curl >/dev/null 2>&1 && curl -fsS "$url" >/dev/null 2>&1; then
      echo
      print_url
      return 0
    fi
    printf "."
    sleep 2
  done
  echo
  echo "The containers started, but the web app did not answer yet."
  echo "Run: ./odysseus-local.sh logs"
  return 1
}

start_stack() {
  require_docker
  ensure_env
  compose up -d --build
  compose ps
  wait_for_app || true
  echo
  echo "If this is the first boot, get the temporary admin password with:"
  echo "  ./odysseus-local.sh password"
}

fast_start_stack() {
  require_docker
  ensure_env
  compose up -d
  compose ps
  wait_for_app || true
}

install_autostart() {
  require_docker
  local service="odysseus-local-${PROJECT_NAME}.service"
  local service_path="/etc/systemd/system/${service}"

  if ! command -v systemctl >/dev/null 2>&1; then
    echo "systemd was not found on this machine." >&2
    exit 1
  fi
  if [ "$(id -u)" -ne 0 ]; then
    echo "Re-run with sudo to install the boot service:"
    echo "  sudo ./odysseus-local.sh install-autostart"
    exit 1
  fi

  cat >"$service_path" <<EOF
[Unit]
Description=Odysseus local Docker Compose stack
Requires=docker.service
After=docker.service network-online.target
Wants=network-online.target

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=${ROOT_DIR}
ExecStart=${ROOT_DIR}/odysseus-local.sh fast
ExecStop=${ROOT_DIR}/odysseus-local.sh stop
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
EOF

  systemctl daemon-reload
  systemctl enable "$service"
  echo "Installed and enabled ${service}."
  echo "Start it now with: sudo systemctl start ${service}"
}

uninstall_autostart() {
  local service="odysseus-local-${PROJECT_NAME}.service"

  if ! command -v systemctl >/dev/null 2>&1; then
    echo "systemd was not found on this machine." >&2
    exit 1
  fi
  if [ "$(id -u)" -ne 0 ]; then
    echo "Re-run with sudo to remove the boot service:"
    echo "  sudo ./odysseus-local.sh uninstall-autostart"
    exit 1
  fi

  systemctl disable --now "$service" >/dev/null 2>&1 || true
  rm -f "/etc/systemd/system/${service}"
  systemctl daemon-reload
  echo "Removed ${service}."
}

cmd="${1:-start}"
case "$cmd" in
  start|up)
    start_stack
    ;;
  fast)
    fast_start_stack
    ;;
  stop)
    require_docker
    compose stop
    ;;
  restart)
    require_docker
    compose restart
    compose ps
    wait_for_app || true
    ;;
  status|ps)
    require_docker
    compose ps
    ;;
  logs)
    require_docker
    compose logs -f --tail=160 odysseus
    ;;
  password)
    require_docker
    compose logs odysseus | grep -i "temporary password" || {
      echo "No temporary password found in logs."
      echo "If data/auth.json already exists, Odysseus will not generate a new one."
    }
    ;;
  url)
    print_url
    ;;
  install-autostart)
    install_autostart
    ;;
  uninstall-autostart)
    uninstall_autostart
    ;;
  help|-h|--help)
    usage
    ;;
  *)
    echo "Unknown command: $cmd" >&2
    usage
    exit 2
    ;;
esac

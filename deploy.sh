#!/usr/bin/env bash
set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
info()    { echo -e "${GREEN}[whip-up]${NC} $*"; }
warn()    { echo -e "${YELLOW}[whip-up]${NC} $*"; }
error()   { echo -e "${RED}[whip-up]${NC} $*" >&2; exit 1; }

check_deps() {
  for cmd in docker docker-compose node pnpm; do
    command -v "$cmd" &>/dev/null || error "Missing dependency: $cmd"
  done
}

check_env() {
  if [[ ! -f .env ]]; then
    warn ".env not found — copying .env.example"
    cp .env.example .env
    error "Please edit .env and set ANTHROPIC_API_KEY, then re-run."
  fi
  # shellcheck disable=SC1091
  source .env
  [[ -z "${ANTHROPIC_API_KEY:-}" ]] && error "ANTHROPIC_API_KEY is not set in .env"
}

MODE="${1:-dev}"

case "$MODE" in
  dev)
    info "Starting development environment..."
    check_deps
    check_env

    info "Starting Qdrant..."
    docker compose up -d qdrant

    info "Installing dependencies..."
    pnpm install

    info "Building shared package..."
    pnpm --filter @whip-up/shared build

    info "Starting backend + frontend in parallel..."
    pnpm dev
    ;;

  prod)
    info "Building production containers..."
    check_deps
    check_env

    docker compose build
    docker compose up -d

    info "Application running:"
    info "  Frontend: http://localhost:3000"
    info "  Backend:  http://localhost:3001"
    info "  Qdrant:   http://localhost:6333"
    ;;

  seed)
    info "Running crawler to seed Qdrant with recipes..."
    check_deps
    check_env

    docker compose up -d qdrant
    pnpm install
    pnpm --filter @whip-up/shared build
    pnpm --filter @whip-up/crawler crawl

    info "Checking recipe count..."
    COUNT=$(curl -s http://localhost:6333/collections/recipes | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['result']['vectors_count'])" 2>/dev/null || echo "unknown")
    info "Recipes in Qdrant: $COUNT"
    ;;

  stop)
    info "Stopping all services..."
    docker compose down
    ;;

  *)
    echo "Usage: $0 [dev|prod|seed|stop]"
    exit 1
    ;;
esac

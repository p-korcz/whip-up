#!/usr/bin/env bash
set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
info()  { echo -e "${GREEN}[whip-up]${NC} $*"; }
warn()  { echo -e "${YELLOW}[whip-up]${NC} $*"; }
error() { echo -e "${RED}[whip-up]${NC} $*" >&2; exit 1; }

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

wait_for_es() {
  local url="${ELASTICSEARCH_URL:-http://localhost:9200}"
  info "Waiting for Elasticsearch at $url..."
  local retries=30
  until curl -sf "$url/_cluster/health" 2>/dev/null | grep -q '"status"'; do
    retries=$((retries - 1))
    [[ $retries -eq 0 ]] && error "Elasticsearch did not become ready in time."
    sleep 2
  done
  info "Elasticsearch is ready."
}

MODE="${1:-dev}"

case "$MODE" in
  dev)
    info "Starting development environment..."
    check_deps
    check_env

    info "Starting Elasticsearch..."
    docker compose up -d elasticsearch
    wait_for_es

    info "Installing dependencies..."
    pnpm install

    info "Starting backend + frontend in dev mode..."
    pnpm dev
    ;;

  prod)
    info "Building and starting production containers..."
    check_deps
    check_env

    docker compose build
    docker compose up -d elasticsearch
    wait_for_es
    docker compose up -d

    info "Application running:"
    info "  Frontend:       http://localhost:3000"
    info "  Backend:        http://localhost:3001"
    info "  Elasticsearch:  http://localhost:9200"
    ;;

  crawl)
    info "Running crawler once to fetch new recipes..."
    check_deps
    check_env

    docker compose up -d elasticsearch
    wait_for_es

    pnpm install
    pnpm --filter @whip-up/crawler crawl

    ES_URL="${ELASTICSEARCH_URL:-http://localhost:9200}"
    INDEX="${ELASTICSEARCH_INDEX:-recipes}"
    COUNT=$(curl -sf "$ES_URL/$INDEX/_count" | python3 -c "import sys,json; print(json.load(sys.stdin).get('count','?'))" 2>/dev/null || echo "unknown")
    info "Total recipes in index: $COUNT"
    ;;

  stop)
    info "Stopping all services..."
    docker compose down
    ;;

  logs)
    docker compose logs -f "${2:-}"
    ;;

  *)
    echo "Usage: $0 [dev|prod|crawl|stop|logs [service]]"
    exit 1
    ;;
esac

# Whip Up

Find recipes based on ingredients you already have. Enter what's in your kitchen and get recipe suggestions sorted by fewest missing ingredients — in English or Polish.

## Features

- Ingredient input with autocomplete (sourced from known recipe ingredients)
- Recipe search sorted by fewest missing ingredients
- Full recipe detail view with available/missing ingredient highlighting
- English and Polish language support (Polish default, toggle in UI)
- Periodic background crawler that continuously expands the recipe database

## Architecture

```
packages/
  frontend/   React 18 + Vite + react-i18next
  backend/    Express.js REST API
  crawler/    Claude-powered recipe scraper
  shared/     Shared TypeScript types
```

**Storage:** Elasticsearch 8 — one document per recipe URL with bilingual fields (`title_en`/`title_pl`, `ingredients_en`/`ingredients_pl`, `steps_en`/`steps_pl`).

**Crawler:** Uses Anthropic Claude (claude-haiku-4-5-20251001) to extract structured recipe data from page text and translate between EN and PL. Crawls 6 sites (AllRecipes, BBC Good Food, Food.com, Przepisy.pl, Kuchnia WP, Gotujmy.pl). Deduplicates by URL — safe to run repeatedly.

## Prerequisites

- Node.js 20+
- pnpm 9+
- Docker + Docker Compose
- Anthropic API key

## Quick Start

**1. Clone and configure**

```bash
git clone https://github.com/p-korcz/whip-up.git
cd whip-up
cp .env.example .env
# Edit .env and set ANTHROPIC_API_KEY
```

**2. Development mode** (hot-reload, Elasticsearch in Docker)

```bash
./deploy.sh dev
```

Opens:
- Frontend: http://localhost:5173
- Backend: http://localhost:3001

**3. Production mode** (all services containerised)

```bash
./deploy.sh prod
```

Opens:
- Frontend: http://localhost:3000
- Backend: http://localhost:3001

**4. Run the crawler manually**

```bash
./deploy.sh crawl
```

The crawler checks Elasticsearch before fetching each URL — already-known recipes are skipped automatically.

In production, the `crawler` Docker service runs automatically every `CRAWL_INTERVAL_HOURS` (default 24h).

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | — | **Required.** Claude API key for recipe parsing and translation |
| `ELASTICSEARCH_URL` | `http://localhost:9200` | Elasticsearch connection URL |
| `ELASTICSEARCH_INDEX` | `recipes` | Index name |
| `PORT` | `3001` | Backend port |
| `VITE_API_URL` | `http://localhost:3001` | Backend URL (used at frontend build time) |
| `CRAWL_INTERVAL_HOURS` | `24` | Hours between automatic crawler runs |

## API

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/health` | Health check |
| `GET` | `/api/ingredients/autocomplete?q=TEXT&lang=en\|pl` | Ingredient suggestions |
| `POST` | `/api/recipes/search` | Search recipes by ingredients |
| `GET` | `/api/recipes/:id?lang=en\|pl` | Recipe detail |

**POST /api/recipes/search** body:
```json
{ "ingredients": ["pasta", "eggs"], "lang": "en" }
```

## Deployment Commands

```bash
./deploy.sh dev       # Start dev environment
./deploy.sh prod      # Build and start production containers
./deploy.sh crawl     # Run crawler once
./deploy.sh stop      # Stop all containers
./deploy.sh logs      # Tail all logs
./deploy.sh logs backend   # Tail a specific service
```

## Tests

```bash
pnpm install
cd packages/crawler  && pnpm test   # 25 tests
cd packages/backend  && pnpm test   # 39 tests
cd packages/frontend && pnpm test   # 20 tests
```

## Docker Services

| Service | Image | Port |
|---|---|---|
| `elasticsearch` | elasticsearch:8.13.4 | 9200 |
| `backend` | local build | 3001 |
| `frontend` | local build (nginx) | 3000 |
| `crawler` | local build | — (scheduled) |

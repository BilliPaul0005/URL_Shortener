<div align="center">

```
██╗   ██╗██████╗ ██╗      ███████╗██╗  ██╗ ██████╗ ██████╗ ████████╗
██║   ██║██╔══██╗██║      ██╔════╝██║  ██║██╔═══██╗██╔══██╗╚══██╔══╝
██║   ██║██████╔╝██║      ███████╗███████║██║   ██║██████╔╝   ██║   
██║   ██║██╔══██╗██║      ╚════██║██╔══██║██║   ██║██╔══██╗   ██║   
╚██████╔╝██║  ██║███████╗ ███████║██║  ██║╚██████╔╝██║  ██║   ██║   
 ╚═════╝ ╚═╝  ╚═╝╚══════╝ ╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═╝   ╚═╝  
```

### A production-ready URL shortener with Redis caching & per-click analytics

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-7-DC382D?style=flat-square&logo=redis&logoColor=white)](https://redis.io/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker&logoColor=white)](https://www.docker.com/)
[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=flat-square&logo=python&logoColor=white)](https://www.python.org/)
[![Railway](https://img.shields.io/badge/Deploy-Railway-0B0D0E?style=flat-square&logo=railway&logoColor=white)](https://railway.app/)

<br/>

[**Live Demo**](https://your-app.up.railway.app) · [**API Docs**](#-api-reference) · [**Quick Start**](#-quick-start) · [**Deploy**](#-deployment)

</div>

---

## ✨ What it does

| Feature | Details |
|---|---|
| 🔗 **URL Shortening** | Generates a 7-char `nanoid` slug, optionally custom |
| ⚡ **Redis Caching** | Cache-hit redirects in ~18ms (24h TTL per slug) |
| 📊 **Click Analytics** | Total clicks, unique IPs, daily breakdown per slug |
| 🐍 **Python Bulk Import** | CSV → batch shorten → output CSV with slugs |
| 🔒 **Rate Limiting** | 100 req / 15 min per IP on the shorten endpoint |
| 🐳 **One-Command Setup** | Full stack via `docker compose up --build` |
| 🚀 **Railway Ready** | Dockerfile + env wiring for zero-config deploy |

---

## 🏗 Architecture

```
                          ┌─────────────────────────────────────┐
                          │         Node.js / Express            │
                          │         TypeScript (strict)          │
                          │                                      │
  Client ─── POST ──────▶ │  /api/shorten   → slug generator    │
  Client ─── GET  ──────▶ │  /:slug         → redirect + log    │──▶ 302 Redirect
  Client ─── GET  ──────▶ │  /api/analytics → click stats       │
                          │  /api/urls      → list + delete      │
                          └──────────┬──────────────┬───────────┘
                                     │              │
                          ┌──────────▼───┐  ┌───────▼──────────┐
                          │    Redis 7   │  │  PostgreSQL 15    │
                          │  slug cache  │  │  urls + clicks    │
                          │  TTL: 24h    │  │  analytics data   │
                          └──────────────┘  └──────────────────┘

  Python Script ──── CSV ──▶  POST /api/shorten (batched)  ──▶  output CSV
```

### Cache Flow

```
  GET /:slug
      │
      ▼
  Redis lookup ──── HIT ──────────────────▶  302 redirect  (~18ms)
      │
     MISS
      │
      ▼
  PostgreSQL query ──▶  write to Redis (24h TTL)  ──▶  302 redirect + log click
```

---

## 🚀 Quick Start

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running
- That's it — no Node.js or PostgreSQL needed on your machine

### Option 1 — Full Docker Stack (recommended)

```bash
# Clone
git clone https://github.com/BilliPaul0005/URL_Shortener.git
cd URL_Shortener

# Copy env and use Docker values
cp .env.example .env
# In .env: uncomment OPTION A for both DATABASE_URL and REDIS_URL

# Start everything
docker compose up --build
```

App runs on `http://localhost:3000` · PostgreSQL on `:5432` · Redis on `:6379`

### Option 2 — Local Dev with Hot Reload

```bash
# Start only Postgres + Redis in Docker
docker compose up db redis -d

# Install dependencies
npm install

# Copy env and use local values
cp .env.example .env
# In .env: uncomment OPTION B for both DATABASE_URL and REDIS_URL

# Run with hot-reload
npm run dev
```

### Verify it's working

```bash
# Health check
curl http://localhost:3000/health

# Shorten a URL
curl -X POST http://localhost:3000/api/shorten \
  -H "Content-Type: application/json" \
  -d '{"url": "https://github.com/BilliPaul0005/URL_Shortener"}'

# Visit the short link (replace slug)
curl -v http://localhost:3000/a1b2c3d
# → 302 redirect ✓
```

---

## 📡 API Reference

<details>
<summary><b>POST /api/shorten</b> — Create a short URL</summary>

<br/>

**Request**
```bash
curl -X POST http://localhost:3000/api/shorten \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com/very/long/path",
    "custom_slug": "my-link",
    "expires_at": "2026-12-31T23:59:59Z"
  }'
```

**Body**

| Field | Type | Required | Description |
|---|---|---|---|
| `url` | string | ✅ | The URL to shorten |
| `custom_slug` | string | ❌ | Custom slug (3–10 chars, alphanumeric + hyphens) |
| `expires_at` | string | ❌ | ISO 8601 expiry date |

**Response `201`**
```json
{
  "short_url": "http://localhost:3000/a1b2c3d",
  "slug": "a1b2c3d",
  "original_url": "https://example.com/very/long/path",
  "created_at": "2026-03-21T13:00:00.000Z",
  "expires_at": null
}
```

</details>

<details>
<summary><b>GET /:slug</b> — Redirect to original URL</summary>

<br/>

Redirects with `302`. Logs click (IP + user-agent + timestamp) **asynchronously** — redirect is never delayed by analytics writes.

```bash
curl -v http://localhost:3000/a1b2c3d
# < HTTP/1.1 302 Found
# < Location: https://example.com/very/long/path
```

Returns `404` if slug not found, `410 Gone` if expired.

</details>

<details>
<summary><b>GET /api/analytics/:slug</b> — Per-slug click analytics</summary>

<br/>

```bash
curl http://localhost:3000/api/analytics/a1b2c3d
```

**Response `200`**
```json
{
  "url": {
    "original_url": "https://example.com/very/long/path",
    "slug": "a1b2c3d",
    "created_at": "2026-03-21T13:00:00.000Z"
  },
  "total_clicks": 42,
  "unique_ips": 18,
  "clicks_by_day": [
    { "date": "2026-03-21", "clicks": "5" },
    { "date": "2026-03-22", "clicks": "12" }
  ],
  "recent_clicks": [
    {
      "clicked_at": "2026-03-22T09:14:00.000Z",
      "ip_address": "203.0.113.42",
      "user_agent": "Mozilla/5.0 ..."
    }
  ]
}
```

</details>

<details>
<summary><b>GET /api/urls</b> — List all URLs (paginated)</summary>

<br/>

```bash
curl "http://localhost:3000/api/urls?page=1&limit=20"
```

Returns array of URL objects with click counts.

</details>

<details>
<summary><b>DELETE /api/urls/:slug</b> — Delete a short URL</summary>

<br/>

```bash
curl -X DELETE http://localhost:3000/api/urls/a1b2c3d
```

Deletes the URL record and all associated click history.

</details>

<details>
<summary><b>GET /health</b> — Health check</summary>

<br/>

```bash
curl http://localhost:3000/health
# { "status": "ok", "timestamp": "2026-03-21T13:00:00.000Z" }
```

</details>

---

## 🗄 Database Schema

```sql
-- Stores every shortened URL
CREATE TABLE urls (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_url TEXT        NOT NULL,
  slug         VARCHAR(10) NOT NULL UNIQUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at   TIMESTAMPTZ
);

CREATE INDEX idx_urls_slug ON urls(slug);

-- Stores every click event
CREATE TABLE clicks (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url_id     UUID        NOT NULL REFERENCES urls(id) ON DELETE CASCADE,
  clicked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT
);

CREATE INDEX idx_clicks_url_id    ON clicks(url_id);
CREATE INDEX idx_clicks_clicked_at ON clicks(clicked_at);
```

---

## 🐍 Python Bulk Import

Import hundreds of URLs in one go from a CSV file.

```bash
# input.csv must have a 'url' column header
python scripts/bulk_import.py input.csv output.csv
```

**input.csv**
```
url
https://github.com/BilliPaul0005
https://docs.railway.app/deploy/nodejs
https://redis.io/docs/data-types/strings/
```

**output.csv** (generated)
```
url,slug,short_url
https://github.com/BilliPaul0005,a1b2c3d,http://localhost:3000/a1b2c3d
https://docs.railway.app/deploy/nodejs,x9y8z7w,http://localhost:3000/x9y8z7w
```

The script reads URLs in batches, hits `POST /api/shorten`, and writes the slug mappings back — all in ~20 lines of Python using `requests` and `csv`.

---

## 🌲 Project Structure

```
URL_Shortener/
│
├── src/
│   ├── index.ts                 # Server entry point
│   ├── app.ts                   # Express app setup + redirect handler
│   │
│   ├── routes/
│   │   ├── shorten.ts           # POST /api/shorten · GET /api/urls · DELETE /api/urls/:slug
│   │   └── analytics.ts         # GET /api/analytics/:slug
│   │
│   ├── services/
│   │   ├── db.ts                # PostgreSQL pool + auto-migration on startup
│   │   ├── redis.ts             # Redis client + get/set/del helpers
│   │   └── slug.ts              # nanoid slug generator (7 chars, URL-safe)
│   │
│   └── middleware/
│       ├── rateLimiter.ts       # 100 req / 15 min per IP (express-rate-limit)
│       └── validate.ts          # URL validation middleware
│
├── scripts/
│   └── bulk_import.py           # Python CSV bulk import tool
│
├── docker-compose.yml           # App + PostgreSQL + Redis
├── Dockerfile                   # Multi-stage Node.js build
├── .env.example                 # Environment variable reference
├── package.json
└── tsconfig.json
```

---

## 🚂 Deployment

### Railway (recommended)

> Railway hosts the backend (Express), PostgreSQL, and Redis — all in one project.

**Step 1** — Push your repo to GitHub (already done ✓)

**Step 2** — Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub** → select `URL_Shortener`

**Step 3** — Add services in your Railway project:
- Click **+ New** → **Database** → **PostgreSQL**
- Click **+ New** → **Database** → **Redis**

**Step 4** — In your Node.js service → **Variables** tab, add:

```
DATABASE_URL  =  ${{Postgres.DATABASE_URL}}
REDIS_URL     =  ${{Redis.REDIS_URL}}
NODE_ENV      =  production
PORT          =  3000
BASE_URL      =  https://your-app-name.up.railway.app
```

**Step 5** — In your Node.js service → **Settings** → **Networking** → **Generate Domain**

Copy the domain and update `BASE_URL` in Variables.

**Step 6** — Every `git push` to `main` auto-redeploys. ✓

---

## ⚙️ Environment Variables

See [`.env.example`](.env.example) for the full reference with instructions.

| Variable | Local (Docker) | Local (npm dev) | Railway |
|---|---|---|---|
| `PORT` | `3000` | `3000` | auto-injected |
| `BASE_URL` | `http://localhost:3000` | `http://localhost:3000` | your Railway domain |
| `DATABASE_URL` | `...@db:5432/...` | `...@localhost:5433/...` | `${{Postgres.DATABASE_URL}}` |
| `REDIS_URL` | `redis://redis:6379` | `redis://localhost:6379` | `${{Redis.REDIS_URL}}` |
| `NODE_ENV` | `development` | `development` | `production` |

---

## 🛡 Rate Limiting

- **Endpoint:** `POST /api/shorten`
- **Limit:** 100 requests per 15 minutes per IP
- **Response on breach:** `429 Too Many Requests`
- **Headers returned:** `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `Retry-After`

---

<div align="center">

Built by [Vivek Kumar Jha](https://github.com/BilliPaul0005) · B.Tech CSE · Rashtriya Raksha University

[![GitHub](https://img.shields.io/badge/GitHub-BilliPaul0005-181717?style=flat-square&logo=github)](https://github.com/BilliPaul0005)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-vivekrjha1981-0A66C2?style=flat-square&logo=linkedin)](https://linkedin.com/in/vivekrjha1981)

</div>




























<!-- # 🔗 URL Shortener with Click Analytics

A production-ready REST API that generates short URLs, redirects users via a Redis-cached lookup, and tracks every click with timestamp, IP, and user-agent analytics.

## Architecture

```
Client ──▶ Node.js/Express (TypeScript) ──▶ Redis (slug cache, 24h TTL)
                                          └──▶ PostgreSQL (urls + clicks)
Python bulk-import script (requests + csv)
```

## Tech Stack

| Layer       | Technology                    |
|-------------|-------------------------------|
| Runtime     | Node.js 18 + Express          |
| Language    | TypeScript (strict mode)      |
| Database    | PostgreSQL 15                 |
| Cache       | Redis 7 (24h TTL per slug)    |
| Slug Gen    | nanoid (7 chars, URL-safe)    |
| Containers  | Docker Compose                |

## Quick Start

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running

### One-Command Setup

```bash
docker compose up --build
```

This spins up three containers (app on `:3000`, PostgreSQL on `:5432`, Redis on `:6379`).

### Local Development (without Docker for the app)

```bash
# Start only Postgres + Redis
docker compose up db redis -d

# Install dependencies
npm install

# Run with hot-reload
npm run dev
```

## API Reference

### `POST /api/shorten`
Create a short URL.

```bash
curl -X POST http://localhost:3000/api/shorten \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com/very/long/path"}'
```

**Request Body:**
| Field        | Type   | Required | Description             |
|-------------|--------|----------|-------------------------|
| `url`        | string | ✅       | The URL to shorten       |
| `custom_slug`| string | ❌       | Custom slug (3-10 chars) |
| `expires_at` | string | ❌       | Expiry date (ISO 8601)   |

**Response** `201`:
```json
{
  "short_url": "http://localhost:3000/a1b2c3d",
  "slug": "a1b2c3d",
  "original_url": "https://example.com/very/long/path",
  "created_at": "2026-03-21T13:00:00.000Z",
  "expires_at": null
}
```

### `GET /:slug`
Redirects to the original URL (302). Logs the click asynchronously.

```bash
curl -v http://localhost:3000/a1b2c3d
# → 302 redirect to https://example.com/very/long/path
```

### `GET /api/analytics/:slug`
Get click analytics for a slug.

```bash
curl http://localhost:3000/api/analytics/a1b2c3d
```

**Response** `200`:
```json
{
  "url": { "original_url": "...", "slug": "a1b2c3d", "created_at": "..." },
  "total_clicks": 42,
  "unique_ips": 18,
  "clicks_by_day": [{ "date": "2026-03-21", "clicks": "5" }],
  "recent_clicks": [{ "clicked_at": "...", "ip_address": "...", "user_agent": "..." }]
}
```

### `GET /api/urls?page=1&limit=20`
List all shortened URLs (paginated).

### `DELETE /api/urls/:slug`
Delete a short URL and its click history.

### `GET /health`
Health check endpoint.

## Database Schema

### `urls`
| Column       | Type          | Constraint    |
|-------------|---------------|---------------|
| id           | UUID          | PK            |
| original_url | TEXT          | NOT NULL      |
| slug         | VARCHAR(10)   | UNIQUE        |
| created_at   | TIMESTAMPTZ   | DEFAULT NOW() |
| expires_at   | TIMESTAMPTZ   | NULLABLE      |

### `clicks`
| Column     | Type        | Constraint          |
|-----------|-------------|---------------------|
| id         | UUID        | PK                  |
| url_id     | UUID        | FK → urls.id        |
| clicked_at | TIMESTAMPTZ | DEFAULT NOW()       |
| ip_address | INET        |                     |
| user_agent | TEXT        |                     |

## Python Bulk Import

```bash
# Create input.csv with a 'url' column header
python scripts/bulk_import.py input.csv output.csv
```

## Project Structure

```
├── docker-compose.yml
├── Dockerfile
├── .env
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts              # Server entry point
│   ├── app.ts                # Express app + redirect handler
│   ├── routes/
│   │   ├── shorten.ts        # POST /api/shorten, GET/DELETE /api/urls
│   │   └── analytics.ts      # GET /api/analytics/:slug
│   ├── services/
│   │   ├── db.ts             # PostgreSQL pool + migrations
│   │   ├── redis.ts          # Redis cache helpers
│   │   └── slug.ts           # nanoid slug generator
│   └── middleware/
│       ├── rateLimiter.ts    # 100 req/15 min
│       └── validate.ts       # Request validation
└── scripts/
    └── bulk_import.py        # CSV bulk import
```

## Deployment (Railway)

1. Push to GitHub
2. Create a new project on [Railway](https://railway.app)
3. Add **PostgreSQL** and **Redis** plugins
4. Connect your GitHub repo
5. Set environment variables: `DATABASE_URL`, `REDIS_URL`, `BASE_URL`, `PORT`
6. Deploy — Railway auto-detects the Dockerfile

## Rate Limiting

- **100 requests** per **15 minutes** per IP on the shorten endpoint
- Returns `429 Too Many Requests` when exceeded -->

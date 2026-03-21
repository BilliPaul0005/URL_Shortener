# 🔗 URL Shortener with Click Analytics

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
- Returns `429 Too Many Requests` when exceeded

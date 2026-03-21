import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const query = (text: string, params?: unknown[]) =>
  pool.query(text, params);

export async function initDB(): Promise<void> {
  // Enable uuid-ossp extension
  await pool.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);

  // Create urls table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS urls (
      id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      original_url TEXT NOT NULL,
      slug        VARCHAR(10) UNIQUE NOT NULL,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      expires_at  TIMESTAMPTZ
    );
  `);

  // Create index on slug for fast lookups
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_urls_slug ON urls (slug);
  `);

  // Create clicks table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS clicks (
      id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      url_id      UUID NOT NULL REFERENCES urls(id) ON DELETE CASCADE,
      clicked_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      ip_address  INET,
      user_agent  TEXT
    );
  `);

  // Index on url_id for analytics queries
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_clicks_url_id ON clicks (url_id);
  `);

  console.log('✅ Database tables initialized');
}

export default pool;

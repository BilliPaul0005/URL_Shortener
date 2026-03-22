import express, { Request, Response } from 'express';
import cors from 'cors';

import { query } from './services/db';
import { getCache, setCache } from './services/redis';
import shortenRouter from './routes/shorten';
import analyticsRouter from './routes/analytics';

const app = express();

// ── Global Middleware ──
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

// ── Health Check ──
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── API Routes ──
app.use('/api', shortenRouter);
app.use('/api/analytics', analyticsRouter);

// ── Redirect Route ──
// GET /:slug → 302 redirect, log click asynchronously
app.get('/:slug', async (req: Request, res: Response): Promise<void> => {
  try {
    const { slug } = req.params;

    // 1. Check Redis cache first
    let originalUrl = await getCache(slug);

    if (!originalUrl) {
      // 2. Cache miss — query PostgreSQL
      const { rows } = await query(
        'SELECT id, original_url, expires_at FROM urls WHERE slug = $1',
        [slug]
      );

      if (rows.length === 0) {
        res.status(404).json({ error: 'Short URL not found.' });
        return;
      }

      const record = rows[0];

      // Check expiration
      if (record.expires_at && new Date(record.expires_at) < new Date()) {
        res.status(410).json({ error: 'This short URL has expired.' });
        return;
      }

      originalUrl = record.original_url;

      // 3. Write to Redis cache (24h TTL)
      await setCache(slug, originalUrl!);
    }

    // 4. Log the click asynchronously (fire-and-forget)
    const ip =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.socket.remoteAddress ||
      '0.0.0.0';
    const userAgent = req.headers['user-agent'] || 'unknown';

    // Non-blocking click logging
    query(
      `INSERT INTO clicks (url_id, ip_address, user_agent)
       VALUES (
         (SELECT id FROM urls WHERE slug = $1),
         $2::inet,
         $3
       )`,
      [slug, ip, userAgent]
    ).catch((err) => console.error('Click logging error:', err));

    // 5. Redirect
    res.redirect(302, originalUrl!);
  } catch (err) {
    console.error('Redirect error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

export default app;

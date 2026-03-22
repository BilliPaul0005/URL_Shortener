import express, { Request, Response } from 'express';
import cors from 'cors';

import { query } from './services/db';
import { getCache, setCache } from './services/redis';
import shortenRouter from './routes/shorten';
import analyticsRouter from './routes/analytics';

const app = express();

// Railway runs behind a reverse proxy; trust forwarded headers for protocol/IP.
app.set('trust proxy', true);

// ── Global Middleware ──
app.use(
  cors({
    origin:
      process.env.NODE_ENV === 'production' ? true : 'http://localhost:5173',
  })
);
app.use(express.json());

// ── Root ──
app.get('/', (_req: Request, res: Response) => {
  res.json({
    name: 'URL Shortener API',
    status: 'live',
    version: '1.0.0',
    endpoints: {
      shorten: 'POST /api/shorten',
      redirect: 'GET /:slug',
      analytics: 'GET /api/analytics/:slug',
      list: 'GET /api/urls',
      delete: 'DELETE /api/urls/:slug',
      health: 'GET /health',
    },
  });
});

// ── Health Check ──
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── API Routes ──
app.use('/api', shortenRouter);
app.use('/api/analytics', analyticsRouter);

// ── Redirect Route ──
app.get('/:slug', async (req: Request, res: Response): Promise<void> => {
  try {
    const { slug } = req.params;

    let originalUrl = await getCache(slug);

    if (!originalUrl) {
      const { rows } = await query(
        'SELECT id, original_url, expires_at FROM urls WHERE slug = $1',
        [slug]
      );

      if (rows.length === 0) {
        res.status(404).json({ error: 'Short URL not found.' });
        return;
      }

      const record = rows[0];

      if (record.expires_at && new Date(record.expires_at) < new Date()) {
        res.status(410).json({ error: 'This short URL has expired.' });
        return;
      }

      originalUrl = record.original_url;
      await setCache(slug, originalUrl!);
    }

    const ip =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.socket.remoteAddress ||
      '0.0.0.0';
    const userAgent = req.headers['user-agent'] || 'unknown';

    query(
      `INSERT INTO clicks (url_id, ip_address, user_agent)
       VALUES (
         (SELECT id FROM urls WHERE slug = $1),
         $2::inet,
         $3
       )`,
      [slug, ip, userAgent]
    ).catch((err) => console.error('Click logging error:', err));

    res.redirect(302, originalUrl!);
  } catch (err) {
    console.error('Redirect error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

export default app;

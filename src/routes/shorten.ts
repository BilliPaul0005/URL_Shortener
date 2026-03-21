import { Router, Request, Response } from 'express';
import { query } from '../services/db';
import { generateSlug } from '../services/slug';
import { setCache, delCache } from '../services/redis';
import { validateShortenBody } from '../middleware/validate';
import { shortenLimiter } from '../middleware/rateLimiter';

const router = Router();

/**
 * POST /api/shorten
 * Create a shortened URL
 */
router.post(
  '/shorten',
  shortenLimiter,
  validateShortenBody,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { url, custom_slug, expires_at } = req.body;

      // If custom slug provided, check availability
      if (custom_slug) {
        const existing = await query('SELECT 1 FROM urls WHERE slug = $1', [
          custom_slug,
        ]);
        if (existing.rows.length > 0) {
          res.status(409).json({ error: 'Custom slug already in use.' });
          return;
        }
      }

      const slug = custom_slug || (await generateSlug());

      const { rows } = await query(
        `INSERT INTO urls (original_url, slug, expires_at)
         VALUES ($1, $2, $3)
         RETURNING id, original_url, slug, created_at, expires_at`,
        [url, slug, expires_at || null]
      );

      const record = rows[0];
      const baseUrl = process.env.BASE_URL || 'http://localhost:3000';

      // Pre-warm Redis cache
      await setCache(slug, url);

      res.status(201).json({
        short_url: `${baseUrl}/${record.slug}`,
        slug: record.slug,
        original_url: record.original_url,
        created_at: record.created_at,
        expires_at: record.expires_at,
      });
    } catch (err) {
      console.error('Shorten error:', err);
      res.status(500).json({ error: 'Internal server error.' });
    }
  }
);

/**
 * GET /api/urls
 * List all shortened URLs (paginated)
 */
router.get('/urls', async (req: Request, res: Response): Promise<void> => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(
      100,
      Math.max(1, parseInt(req.query.limit as string) || 20)
    );
    const offset = (page - 1) * limit;

    const countResult = await query('SELECT COUNT(*) FROM urls');
    const total = parseInt(countResult.rows[0].count, 10);

    const { rows } = await query(
      `SELECT id, original_url, slug, created_at, expires_at
       FROM urls
       ORDER BY created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';

    res.json({
      data: rows.map((r) => ({
        ...r,
        short_url: `${baseUrl}/${r.slug}`,
      })),
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error('List URLs error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

/**
 * DELETE /api/urls/:slug
 * Delete a shortened URL and its click data
 */
router.delete(
  '/urls/:slug',
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { slug } = req.params;

      const result = await query(
        'DELETE FROM urls WHERE slug = $1 RETURNING id',
        [slug]
      );

      if (result.rows.length === 0) {
        res.status(404).json({ error: 'Slug not found.' });
        return;
      }

      // Clear from Redis
      await delCache(slug);

      res.json({ message: 'URL deleted successfully.' });
    } catch (err) {
      console.error('Delete error:', err);
      res.status(500).json({ error: 'Internal server error.' });
    }
  }
);

export default router;

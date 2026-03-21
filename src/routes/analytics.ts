import { Router, Request, Response } from 'express';
import { query } from '../services/db';

const router = Router();

/**
 * GET /api/analytics/:slug
 * Returns click analytics for a given slug
 */
router.get('/:slug', async (req: Request, res: Response): Promise<void> => {
  try {
    const { slug } = req.params;

    // Check if the slug exists
    const urlResult = await query(
      'SELECT id, original_url, slug, created_at FROM urls WHERE slug = $1',
      [slug]
    );

    if (urlResult.rows.length === 0) {
      res.status(404).json({ error: 'Slug not found.' });
      return;
    }

    const urlRecord = urlResult.rows[0];

    // Total clicks
    const totalResult = await query(
      'SELECT COUNT(*) AS total FROM clicks WHERE url_id = $1',
      [urlRecord.id]
    );
    const total_clicks = parseInt(totalResult.rows[0].total, 10);

    // Unique IPs
    const uniqueResult = await query(
      'SELECT COUNT(DISTINCT ip_address) AS unique_ips FROM clicks WHERE url_id = $1',
      [urlRecord.id]
    );
    const unique_ips = parseInt(uniqueResult.rows[0].unique_ips, 10);

    // Clicks grouped by day (last 30 days)
    const dailyResult = await query(
      `SELECT DATE(clicked_at) AS date, COUNT(*) AS clicks
       FROM clicks
       WHERE url_id = $1 AND clicked_at >= NOW() - INTERVAL '30 days'
       GROUP BY DATE(clicked_at)
       ORDER BY date DESC`,
      [urlRecord.id]
    );

    // Recent 10 clicks
    const recentResult = await query(
      `SELECT clicked_at, ip_address, user_agent
       FROM clicks
       WHERE url_id = $1
       ORDER BY clicked_at DESC
       LIMIT 10`,
      [urlRecord.id]
    );

    res.json({
      url: {
        original_url: urlRecord.original_url,
        slug: urlRecord.slug,
        created_at: urlRecord.created_at,
      },
      total_clicks,
      unique_ips,
      clicks_by_day: dailyResult.rows,
      recent_clicks: recentResult.rows,
    });
  } catch (err) {
    console.error('Analytics error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;

import { Request, Response, NextFunction } from 'express';

/**
 * Validate the POST /api/shorten request body.
 * Requires a valid URL; optionally accepts custom_slug and expires_at.
 */
export function validateShortenBody(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const { url, custom_slug, expires_at } = req.body;

  // URL is required
  if (!url || typeof url !== 'string') {
    res.status(400).json({ error: 'A valid "url" field is required.' });
    return;
  }

  // Validate URL format
  try {
    new URL(url);
  } catch {
    res.status(400).json({ error: 'Invalid URL format.' });
    return;
  }

  // Max length check
  if (url.length > 2048) {
    res.status(400).json({ error: 'URL must be 2048 characters or fewer.' });
    return;
  }

  // Optional: validate custom slug format
  if (custom_slug !== undefined) {
    if (
      typeof custom_slug !== 'string' ||
      custom_slug.length < 3 ||
      custom_slug.length > 10 ||
      !/^[a-zA-Z0-9_-]+$/.test(custom_slug)
    ) {
      res.status(400).json({
        error:
          'custom_slug must be 3-10 alphanumeric characters (hyphens and underscores allowed).',
      });
      return;
    }
  }

  // Optional: validate expires_at
  if (expires_at !== undefined) {
    const date = new Date(expires_at);
    if (isNaN(date.getTime()) || date <= new Date()) {
      res
        .status(400)
        .json({ error: 'expires_at must be a valid future date.' });
      return;
    }
  }

  next();
}

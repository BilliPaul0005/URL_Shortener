import { nanoid } from 'nanoid';
import { query } from './db';

const SLUG_LENGTH = 7;

/**
 * Generate a unique URL-safe slug.
 * Retries up to 5 times on collision.
 */
export async function generateSlug(): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const slug = nanoid(SLUG_LENGTH);
    const { rows } = await query('SELECT 1 FROM urls WHERE slug = $1', [slug]);
    if (rows.length === 0) return slug;
  }
  throw new Error('Failed to generate a unique slug after 5 attempts');
}

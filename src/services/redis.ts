import Redis from 'ioredis';

const CACHE_TTL = 60 * 60 * 24; // 24 hours in seconds

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

redis.on('connect', () => console.log('🔴 Redis connected'));
redis.on('error', (err) => console.error('Redis error:', err));

/** Get a cached original URL for a given slug */
export async function getCache(slug: string): Promise<string | null> {
  return redis.get(`slug:${slug}`);
}

/** Cache a slug → original URL mapping with 24h TTL */
export async function setCache(slug: string, url: string): Promise<void> {
  await redis.set(`slug:${slug}`, url, 'EX', CACHE_TTL);
}

/** Remove a slug from cache */
export async function delCache(slug: string): Promise<void> {
  await redis.del(`slug:${slug}`);
}

export default redis;

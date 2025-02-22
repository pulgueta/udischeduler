import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

import { keys } from './keys.js';

const redis = new Redis({
  url: keys.UPSTASH_REDIS_REST_URL,
  token: keys.UPSTASH_REDIS_REST_TOKEN,
});

const ratelimitInstance = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '10s'),
});

export async function ratelimit(key: string) {
  const rl = await ratelimitInstance.limit(key);

  return !rl.success;
}

export async function setCacheKey<T>(key: string, value: T) {
  await redis.set(key, JSON.stringify(value));
}

export async function getCacheKey<T>(key: string) {
  const value = (await redis.get(key)) as unknown as string;

  return value as T;
}

export async function deleteCacheKey(key: string) {
  await redis.del(key);
}

export const cacheKeys = {
  student: 'student',
  students: 'students',
  booking: 'booking',
  bookings: 'bookings',
} as const;

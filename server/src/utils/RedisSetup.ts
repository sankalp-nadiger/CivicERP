import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

// Create a Redis client only if REDIS_URL is provided
const REDIS_URL = process.env.REDIS_URL || process.env.REDIS_URI || '';
const client = createClient({ url: REDIS_URL || undefined });

client.on("error", (err) => console.error("Redis error:", err));

export async function initRedis() {
  if (!REDIS_URL) {
    console.log('Redis not configured; skipping Redis connection');
    return;
  }

  try {
    await client.connect();
    console.log('Connected to Redis');
  } catch (err: any) {
    console.error('Failed to connect to Redis:', err?.message || err);
  }
}

export default client;
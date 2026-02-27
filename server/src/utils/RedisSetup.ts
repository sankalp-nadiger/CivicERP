import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

// Create a Redis client only if REDIS_URL is provided
const REDIS_URL = process.env.REDIS_URL || process.env.REDIS_URI || '';

let client: any;

if (REDIS_URL) {
  client = createClient({ url: REDIS_URL });
  client.on("error", (err: any) => console.error("Redis error:", err));
} else {
  // Provide a harmless stub so call sites can call set/get without errors
  client = {
    isStub: true,
    connect: async () => { console.log('Redis not configured; stub client in use'); },
    set: async (_key: string, _value: string) => { /* no-op */ },
    get: async (_key: string) => null,
    on: (_ev: string, _cb: any) => {},
  };
}

export async function initRedis() {
  if (!REDIS_URL) {
    console.log('Redis not configured; skipping Redis connection (stub client)');
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
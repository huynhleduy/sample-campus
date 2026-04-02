import { env } from 'node:process';
import { RedisMemoryServer } from 'redis-memory-server';
import type { RedisInstanceDataT } from 'redis-memory-server/lib/RedisMemoryServer';

export const NO_REDIS = env.NO_REDIS !== 'false';

const REDIS = new RedisMemoryServer({
  autoStart: false,
  binary: {
    version: '7.2.4',
  },
});

export async function startRedis(): Promise<RedisInstanceDataT> {
  return REDIS.start().then(() => REDIS.ensureInstance());
}

export async function stopRedis(): Promise<boolean> {
  return REDIS.stop();
}

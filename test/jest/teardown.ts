import { NO_POSTGRES, stopPostgres } from './postgres';
import { NO_REDIS, stopRedis } from './redis';

export default async function teardownJest() {
  const promises: Promise<unknown>[] = [];

  if (!NO_POSTGRES) {
    promises.push(stopPostgres());
  }

  if (!NO_REDIS) {
    promises.push(stopRedis());
  }

  return Promise.all(promises);
}

process.env.NODE_ENV = 'test';
process.env.PORT = process.env.PORT ?? '0';
process.env.FRONTEND_URL = process.env.FRONTEND_URL ?? 'http://localhost:3000';
process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-jwt-secret';
process.env.JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET ?? 'test-jwt-refresh-secret';
process.env.CLIENT_ID = process.env.CLIENT_ID ?? 'test-client-id';
process.env.CLIENT_SECRET = process.env.CLIENT_SECRET ?? 'test-client-secret';
process.env.OAUTH_URL = process.env.OAUTH_URL ?? 'https://oauth.example.test';
process.env.MEZON_BOT_ID = process.env.MEZON_BOT_ID ?? 'test-bot-id';
process.env.MEZON_BOT_TOKEN = process.env.MEZON_BOT_TOKEN ?? 'test-bot-token';

if ((global as any).__DB_NAME_PREFIX__) {
  process.env.DB_DATABASE = `${(global as any).__DB_NAME_PREFIX__}-database-${
    process.env.SHARD_INDEX || 1
  }-${process.env.JEST_WORKER_ID}`;
}

if ((global as any).__DB_HOST__) {
  process.env.DB_HOST = (global as any).__DB_HOST__;
  process.env.DB_PORT = `${(global as any).__DB_PORT__}`;
  process.env.DB_USERNAME = (global as any).__DB_USERNAME__;
  process.env.DB_PASSWORD = (global as any).__DB_PASSWORD__;
}

if ((global as any).__REDIS_HOST__) {
  process.env.REDIS_HOST = (global as any).__REDIS_HOST__;
  process.env.REDIS_PORT = `${(global as any).__REDIS_PORT__}`;
}

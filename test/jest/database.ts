import { env } from 'node:process';
import { DataSource } from 'typeorm';

let databaseConnection: DataSource | null = null;

export async function connectDB(database: string) {
  if (databaseConnection != null) {
    return databaseConnection;
  }

  databaseConnection = new DataSource({
    type: 'postgres',
    host: env.DB_HOST,
    port: Number(env.DB_PORT),
    username: env.DB_USERNAME,
    password: env.DB_PASSWORD,
    database,
    logging: false,
    synchronize: false,
  });

  return databaseConnection.initialize();
}

export async function disconnectDB() {
  if (databaseConnection == null) {
    return;
  }

  await databaseConnection.destroy();
  databaseConnection = null;
}

export async function setupDB(prefix: string, workers = 1, start = 0) {
  const operations: Array<Promise<unknown>> = [];
  const shards = Number(process.env.CI_NODES || 1);

  await connectDB(`${prefix}-database-1-1`);

  for (let shardIndex = 1; shardIndex <= shards; shardIndex += 1) {
    for (let workerIndex = start; workerIndex < workers; workerIndex += 1) {
      operations.push(
        databaseConnection!.query(
          `CREATE DATABASE "${prefix}-database-${shardIndex}-${workerIndex + 1}"`,
        ),
      );
    }
  }

  return Promise.allSettled(operations).finally(disconnectDB);
}

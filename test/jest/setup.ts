import { env } from 'node:process';
import { type Config } from '@jest/types';
import { kebabCase } from 'lodash';
import { setupDB } from './database';
import { loadProjectEnv } from './local-env';
import {
  isContainerRuntimeUnavailable,
  NO_POSTGRES,
  startPostgres,
} from './postgres';
import { NO_REDIS, startRedis } from './redis';
import teardownJest from './teardown';

function assignDatabaseGlobals(
  projectConfig: Config.ProjectConfig,
  input: {
    host: string;
    port: number | string;
    username: string;
    password: string;
    database?: string;
  },
) {
  env.DB_HOST = projectConfig.globals.__DB_HOST__ = input.host;
  env.DB_PORT = `${(projectConfig.globals.__DB_PORT__ = Number(input.port))}`;
  env.DB_USERNAME = projectConfig.globals.__DB_USERNAME__ = input.username;
  env.DB_PASSWORD = projectConfig.globals.__DB_PASSWORD__ = input.password;

  if (input.database) {
    env.DB_DATABASE = input.database;
  }
}

async function fallbackToLocalDatabase(
  projectConfig: Config.ProjectConfig,
  databaseNamePrefix: string,
  maxWorkers: number,
) {
  const projectEnv = loadProjectEnv();

  const host = env.DB_HOST ?? projectEnv.DB_HOST;
  const port = env.DB_PORT ?? projectEnv.DB_PORT;
  const username = env.DB_USERNAME ?? projectEnv.DB_USERNAME;
  const password = env.DB_PASSWORD ?? projectEnv.DB_PASSWORD;
  const database = env.DB_DATABASE ?? projectEnv.DB_DATABASE;

  if (!host || !port || !username || !password || !database) {
    throw new Error(
      'Testcontainers is unavailable and no fallback database config was found. ' +
        'Start Docker, or define DB_HOST/DB_PORT/DB_USERNAME/DB_PASSWORD/DB_DATABASE in sample-campus/.env.',
    );
  }

  assignDatabaseGlobals(projectConfig, {
    host,
    port,
    username,
    password,
    database,
  });

  try {
    return await setupDB(databaseNamePrefix, maxWorkers);
  } catch (error) {
    const reason =
      error instanceof Error
        ? error.message
        : 'Unknown database connection error';

    throw new Error(
      `Testcontainers is unavailable, and fallback local database connection failed ` +
        `for ${host}:${port}/${database}. Start the sample-campus local Postgres stack ` +
        `or fix sample-campus/.env database settings. Root cause: ${reason}`,
    );
  }
}

export default async function setupJest(
  globalConfig: Config.GlobalConfig,
  projectConfig: Config.ProjectConfig,
) {
  const databaseNamePrefix = kebabCase(
    projectConfig.displayName?.name ?? 'sample-campus',
  );

  projectConfig.globals.__DB_NAME_PREFIX__ = databaseNamePrefix;

  try {
    const promises: Promise<unknown>[] = [];

    if (NO_POSTGRES) {
      promises.push(setupDB(databaseNamePrefix, globalConfig.maxWorkers));
    } else {
      promises.push(
        startPostgres(`${databaseNamePrefix}-database-1-1`)
          .then((postgres) => {
            assignDatabaseGlobals(projectConfig, {
              host: postgres.getHost(),
              port: postgres.getPort(),
              username: postgres.getUsername(),
              password: postgres.getPassword(),
              database: postgres.getDatabase(),
            });

            return setupDB(databaseNamePrefix, globalConfig.maxWorkers, 1);
          })
          .catch((error) => {
            if (!isContainerRuntimeUnavailable(error)) {
              throw error;
            }

            return fallbackToLocalDatabase(
              projectConfig,
              databaseNamePrefix,
              globalConfig.maxWorkers,
            );
          }),
      );
    }

    if (!NO_REDIS) {
      promises.push(
        startRedis().then((redis) => {
          projectConfig.globals.__REDIS_HOST__ = redis.ip;
          projectConfig.globals.__REDIS_PORT__ = redis.port;
        }),
      );
    }

    await Promise.all(promises);
  } catch (error) {
    await teardownJest();
    throw error;
  }
}

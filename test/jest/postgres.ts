import { env } from 'node:process';
import {
  PostgreSqlContainer,
  type StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import { type StoppedTestContainer } from 'testcontainers';

let postgresContainer: StartedPostgreSqlContainer | undefined;
let startedByTestcontainers = false;

export const NO_POSTGRES = env.NO_POSTGRES === 'true';

export async function startPostgres(
  database: string,
): Promise<StartedPostgreSqlContainer> {
  postgresContainer = await new PostgreSqlContainer('postgres:15.5-alpine')
    .withDatabase(database)
    .start();
  startedByTestcontainers = true;

  return postgresContainer;
}

export async function stopPostgres(): Promise<
  StoppedTestContainer | undefined
> {
  if (!startedByTestcontainers) {
    return undefined;
  }

  return postgresContainer?.stop({
    timeout: 10_000,
    removeVolumes: true,
  });
}

export function isContainerRuntimeUnavailable(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  return (
    error.message.includes(
      'Could not find a working container runtime strategy',
    ) ||
    error.message.includes('docker daemon') ||
    error.message.includes('docker.sock') ||
    error.message.includes('operation not permitted')
  );
}

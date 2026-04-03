import { DataSource } from 'typeorm';
import { Factory } from '@src/repl-modules/factories/factory';
import { SHOULD_DEBUG } from './common';
import { resetExternalMocks } from './external';
import { destroyTestingModule, testingModule } from './testing-module';

export async function resetBeforeEach() {
  resetExternalMocks();

  if (testingModule == null) {
    return;
  }

  if (SHOULD_DEBUG) {
    console.time('resetBeforeEach');
  }

  if (SHOULD_DEBUG) {
    console.timeEnd('resetBeforeEach');
  }
}

export async function resetAfterEach() {
  if (testingModule == null) {
    return;
  }

  if (SHOULD_DEBUG) {
    console.time('resetAfterEach');
  }

  Factory.resetStore();

  const dataSource = testingModule.get(DataSource);

  if (dataSource.isInitialized) {
    const tables = dataSource.entityMetadatas
      .filter((entity) => entity.tableType === 'regular')
      .map((entity) => `"${entity.tableName}"`);

    if (tables.length > 0) {
      await dataSource.query(
        `TRUNCATE ${tables.join(', ')} RESTART IDENTITY CASCADE;`,
      );
    }
  }

  if (SHOULD_DEBUG) {
    console.timeEnd('resetAfterEach');
  }
}

export async function resetAfterAll() {
  await destroyTestingModule();
}

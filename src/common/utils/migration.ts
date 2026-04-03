import { chunk } from 'lodash';
import { QueryRunner } from 'typeorm';

const CASTING_REGEX = /^[^\n]+::[A-Z_]+$/;

function addParameter(
  parameters: unknown[],
  value: unknown,
  type?: string,
): string {
  if (typeof value === 'string' && CASTING_REGEX.test(value)) {
    if (type) {
      throw new Error('Cannot specify type for casting');
    }

    return value;
  }

  parameters.push(value);

  const parameter = `$${parameters.length}`;

  if (type) {
    return `${parameter}::${type}`;
  }

  return parameter;
}

function parseQuery(
  criteria?: string,
  criteriaParams: Record<string, unknown> = {},
): ParsedQuery {
  const result: ParsedQuery = {
    filterQuery: '',
    filterQueryParameters: [],
    filterQueryReturnsEmpty: false,
  };

  if (!criteria?.length) {
    return result;
  }

  const keys = Object.keys(criteriaParams);

  for (const key of keys) {
    const value = criteriaParams[key];

    if (Array.isArray(value)) {
      criteria = criteria.replaceAll(
        new RegExp(`:${key}`, 'g'),
        value.map((item) => addParameter(result.filterQueryParameters, item)).join(', '),
      );
      continue;
    }

    criteria = criteria.replaceAll(
      new RegExp(`:${key}`, 'g'),
      addParameter(result.filterQueryParameters, value),
    );
  }

  result.filterQuery += criteria;

  if (/ *"\w+" *IN *\( *\)/.test(result.filterQuery)) {
    result.filterQueryReturnsEmpty = true;
  }

  result.filterQuery = result.filterQuery
    .replaceAll(/ *"\w+" *NOT *IN *\( *\)/g, '')
    .trim();

  return result;
}

export interface ParsedQuery {
  filterQuery: string;
  filterQueryParameters: unknown[];
  filterQueryReturnsEmpty: boolean;
}

export async function selectInMigration<T extends object>(
  queryRunner: QueryRunner,
  table: string,
  select: Array<keyof T> = [],
  criteria?: string,
  criteriaParams: Record<string, unknown> = {},
  limit?: number,
  offset?: number,
  order?: string,
): Promise<T[]> {
  const { filterQuery, filterQueryParameters, filterQueryReturnsEmpty } =
    parseQuery(criteria, criteriaParams);

  if (filterQueryReturnsEmpty) {
    return [];
  }

  let query = 'SELECT';

  if (select.length > 0) {
    query += ` ${select.map((field) => `"${String(field)}"`).join(', ')}`;
  } else {
    query += ' *';
  }

  query += ` FROM "${table}"`;

  if (filterQuery.length) {
    query += ` WHERE ${filterQuery}`;
  }

  if (order) {
    query += ` ${order}`;
  }

  if (limit) {
    query += ` limit ${limit}`;
  }

  if (offset) {
    query += ` offset ${offset}`;
  }

  return queryRunner.query(query, filterQueryParameters);
}

export async function selectRightJoinInMigration<T extends object>(
  queryRunner: QueryRunner,
  table: string,
  select: Array<keyof T> = [],
  joinTable: string,
  joinOn: string,
  criteria?: string,
  criteriaParams: Record<string, unknown> = {},
): Promise<T[]> {
  const { filterQuery, filterQueryParameters, filterQueryReturnsEmpty } =
    parseQuery(criteria, criteriaParams);

  if (filterQueryReturnsEmpty) {
    return [];
  }

  let query = 'SELECT';

  if (select.length > 0) {
    query += ` ${select
      .map((field) =>
        String(field).includes('"') ? String(field) : `"${String(field)}"`,
      )
      .join(', ')}`;
  } else {
    query += ' *';
  }

  query += ` FROM "${table}"`;
  query += ` RIGHT JOIN "${joinTable}" ON ${joinOn}`;

  if (filterQuery.length) {
    query += ` WHERE ${filterQuery}`;
  }

  return queryRunner.query(query, filterQueryParameters);
}

export async function insertInMigration<T extends Record<string, unknown>>(
  queryRunner: QueryRunner,
  table: string,
  records: T[],
  columns?: (keyof T)[],
  chunkSize = 1e3,
  returningFields?: string[],
  onConflictStatement = '',
): Promise<{ id: unknown }[] | void> {
  if (records.length === 0) {
    return;
  }

  if (columns == null) {
    for (const record of records) {
      const keys = Object.keys(record);
      const fields = keys.map((key) => `"${key}"`).join(', ');
      const values = keys.map((_, index) => `$${index + 1}`).join(', ');
      const parameters = keys.map((key) => record[key]);

      await queryRunner.query(
        `INSERT INTO "${table}"(${fields})
         VALUES (${values})`,
        parameters,
      );
    }

    return;
  }

  if (columns.length === 0) {
    throw new Error('1 or more columns expected');
  }

  if (records.length > chunkSize) {
    const recordChunks = chunk(records, chunkSize);

    for (const recordChunk of recordChunks) {
      await insertInMigration(
        queryRunner,
        table,
        recordChunk,
        columns,
        chunkSize,
        returningFields,
        onConflictStatement,
      );
    }

    return;
  }

  const fields = columns.map((column) => `"${String(column)}"`).join(', ');
  const values: string[] = [];
  const parameters: unknown[] = [];

  for (const record of records) {
    const subValues: string[] = [];

    for (const column of columns) {
      const value = record[column];

      if (value == null) {
        subValues.push('DEFAULT');
        continue;
      }

      subValues.push(addParameter(parameters, value));
    }

    values.push(`(${subValues.join(', ')})`);
  }

  const returningStatement =
    returningFields && returningFields.length > 0
      ? ` RETURNING "${returningFields.join('","')}"`
      : '';

  return queryRunner.query(
    `INSERT INTO "${table}"(${fields})
     VALUES ${values.join(', ')}${returningStatement} ${onConflictStatement}`,
    parameters,
  );
}

export async function deleteInMigration(
  queryRunner: QueryRunner,
  table: string,
  criteria?: string,
  criteriaParams: Record<string, unknown> = {},
): Promise<void> {
  const { filterQuery, filterQueryParameters, filterQueryReturnsEmpty } =
    parseQuery(criteria, criteriaParams);

  if (filterQueryReturnsEmpty) {
    return;
  }

  let query = `DELETE
               FROM "${table}"`;

  if (filterQuery.length) {
    query += ` WHERE ${filterQuery}`;
  }

  await queryRunner.query(query, filterQueryParameters);
}

export async function updateInMigration(
  queryRunner: QueryRunner,
  table: string,
  update: Record<string, unknown>,
  criteria?: string,
  criteriaParams: Record<string, unknown> = {},
): Promise<void> {
  const { filterQuery, filterQueryParameters, filterQueryReturnsEmpty } =
    parseQuery(criteria, criteriaParams);

  if (filterQueryReturnsEmpty) {
    return;
  }

  const updateKeys = Object.keys(update);
  const parameters: unknown[] = [...filterQueryParameters];
  const set = updateKeys
    .map((key) => `"${key}" = ${addParameter(parameters, update[key])}`)
    .join(', ');

  let query = `UPDATE "${table}"
               SET ${set}`;

  if (filterQuery.length) {
    query += ` WHERE ${filterQuery}`;
  }

  await queryRunner.query(query, parameters);
}

export async function bulkUpdateInMigration<
  T extends Record<string, unknown>,
  ColumnValue = unknown,
>(
  queryRunner: QueryRunner,
  table: string,
  criteriaColumn: string,
  columns: TTypedColumnName<T>[],
  updates: [criteriaColumnValue: ColumnValue, update: T][],
  criteria?: string,
  criteriaParams: Record<string, unknown> = {},
  chunkSize = 1e3,
) {
  if (updates.length === 0) {
    return;
  }

  if (columns.length === 0) {
    throw new Error('1 or more columns expected');
  }

  if (updates.length > chunkSize) {
    const updateChunks = chunk(updates, chunkSize);

    for (const updateChunk of updateChunks) {
      await bulkUpdateInMigration(
        queryRunner,
        table,
        criteriaColumn,
        columns,
        updateChunk,
        criteria,
        criteriaParams,
        chunkSize,
      );
    }

    return;
  }

  const { filterQuery, filterQueryParameters, filterQueryReturnsEmpty } =
    parseQuery(criteria, criteriaParams);

  if (filterQueryReturnsEmpty) {
    return;
  }

  const [criteriaColumnRaw, criteriaColumnType] = criteriaColumn.split('::');
  const parsedColumns = columns.map((column) =>
    String(column).split('::'),
  ) as [columnRaw: string, columnType?: string][];
  const parameters: unknown[] = [...filterQueryParameters];
  const values: string[] = [];

  for (const [criteriaColumnValue, update] of updates) {
    const value: string[] = [];

    for (const [columnRaw, columnType] of parsedColumns) {
      if (!(columnRaw in update)) {
        throw new Error(`Missing update value for column: "${columnRaw}"`);
      }

      value.push(addParameter(parameters, update[columnRaw], columnType));
    }

    value.push(addParameter(parameters, criteriaColumnValue, criteriaColumnType));
    values.push(`(${value.join(', ')})`);
  }

  const from = values.join(', ');
  const select = parsedColumns
    .concat([[criteriaColumnRaw]])
    .map(([column]) => `"${column}"`)
    .join(', ');
  const tempTableName = 'update_table_in_migration';
  const set = parsedColumns
    .map(([key]) => `"${key}" = "${tempTableName}"."${key}"`)
    .join(', ');

  let query = `UPDATE "${table}"
               SET ${set}
               FROM (VALUES ${from}) AS "${tempTableName}" (${select})
               WHERE "${table}"."${criteriaColumnRaw}" = "${tempTableName}"."${criteriaColumnRaw}"`;

  if (filterQuery.length) {
    query += ` AND ${filterQuery}`;
  }

  return queryRunner.query(query, parameters);
}

export async function renameEnumInMigration(
  queryRunner: QueryRunner,
  enumName: string,
  oldValue: string,
  newValue: string,
) {
  return queryRunner.query(
    `ALTER TYPE "public"."${enumName}" RENAME VALUE '${oldValue}' TO '${newValue}'`,
  );
}

export async function addValuesToEnumInMigration(
  queryRunner: QueryRunner,
  enumName: string,
  values: string[],
  existingEnumName = `${enumName}_old`,
): Promise<void> {
  const existingValues = await listEnumValuesInMigration(
    queryRunner,
    existingEnumName,
    [],
  );

  const newValues = [...new Set(existingValues.concat(values))]
    .map((value) => `'${value}'`)
    .join(', ');

  await queryRunner.query(`CREATE TYPE "public"."${enumName}" AS ENUM(${newValues})`);
}

export async function addValuesToEnumInMigrationV2({
  queryRunner,
  tableName,
  columnName,
  values,
}: {
  queryRunner: QueryRunner;
  tableName: string;
  columnName: string;
  values: string[];
}): Promise<void> {
  const enumName = await queryRunner
    .query(
      `SELECT atttypid::regtype AS enum_name
       FROM pg_attribute
       WHERE attrelid = '${tableName}'::regclass AND attname = '${columnName}';`,
    )
    .then((res) => res[0].enum_name as string);

  const existingValues = await listEnumValuesInMigration(queryRunner, enumName, []);
  const newValues = [...new Set(existingValues.concat(values))]
    .map((value) => `'${value}'`)
    .join(', ');

  await queryRunner.query(`ALTER TYPE "public"."${enumName}" RENAME TO "${enumName}_old"`);
  await queryRunner.query(`CREATE TYPE "public"."${enumName}" AS ENUM(${newValues})`);
  await queryRunner.query(
    `ALTER TABLE "${tableName}" ALTER COLUMN "${columnName}" TYPE "public"."${enumName}" USING "${columnName}"::"text"::"public"."${enumName}"`,
  );
  await queryRunner.query(`DROP TYPE "public"."${enumName}_old"`);
}

export async function listEnumValuesInMigration(
  queryRunner: QueryRunner,
  enumName: string,
  valuesToFilter: string[] = [],
): Promise<string[]> {
  const rawValues = await queryRunner.query(
    `SELECT UNNEST(ENUM_RANGE(NULL::"public"."${enumName}"))`,
  );
  const values: string[] = rawValues.map((value: { unnest: string }) => value.unnest);

  for (const value of valuesToFilter) {
    if (values.includes(value)) {
      continue;
    }

    console.warn(`Enum value "${enumName}"."${value}" does not exist!`);
  }

  return values.filter((value) => !valuesToFilter.includes(value));
}

export async function removeValuesFromEnumInMigration(
  queryRunner: QueryRunner,
  enumName: string,
  values: string[],
  existingEnumName = `${enumName}_old`,
): Promise<void> {
  const filteredValues = await listEnumValuesInMigration(
    queryRunner,
    existingEnumName,
    values,
  );
  const newValues = filteredValues.map((value) => `'${value}'`).join(', ');

  if (newValues.length === 0) {
    throw new Error('All enum values are removed!');
  }

  await queryRunner.query(`CREATE TYPE "public"."${enumName}" AS ENUM(${newValues})`);
}

export async function removeValuesFromEnumInMigrationV2({
  queryRunner,
  tableName,
  columnName,
  values,
}: {
  queryRunner: QueryRunner;
  tableName: string;
  columnName: string;
  values: string[];
}): Promise<void> {
  const enumName = await queryRunner
    .query(
      `SELECT atttypid::regtype AS enum_name
       FROM pg_attribute
       WHERE attrelid = '${tableName}'::regclass AND attname = '${columnName}';`,
    )
    .then((res) => res[0].enum_name as string);

  const filteredValues = await listEnumValuesInMigration(
    queryRunner,
    enumName,
    values,
  );
  const newValues = filteredValues.map((value) => `'${value}'`).join(', ');

  if (newValues.length === 0) {
    throw new Error('All enum values are removed!');
  }

  await queryRunner.query(`CREATE TYPE "public"."${enumName}_old" AS ENUM(${newValues})`);
  await queryRunner.query(
    `ALTER TABLE "${tableName}" ALTER COLUMN "${columnName}" TYPE "public"."${enumName}_old" USING "${columnName}"::"text"::"public"."${enumName}_old"`,
  );
  await queryRunner.query(`DROP TYPE "public"."${enumName}"`);
  await queryRunner.query(`ALTER TYPE "public"."${enumName}_old" RENAME TO "${enumName}"`);
}

export type TTypedColumnName<T extends Record<string, unknown>> =
  | TColumnName<T>
  | `${TColumnName<T>}::${string}`;

export type TColumnName<T extends Record<string, unknown>> = keyof T & string;

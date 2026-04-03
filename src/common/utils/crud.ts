import {
  CrudController,
  CrudRequest,
  type QueryOptions,
  CrudConfigService,
  CrudRequestInterceptor,
  Override,
  ParsedRequest,
} from '@nestjsx/crud';
import {
  ComparisonOperator,
  QueryFilter,
  QuerySort,
  type ParsedRequestParams,
  type SConditionKey,
} from '@nestjsx/crud-request';
import { TypeOrmCrudService } from '@nestjsx/crud-typeorm';
import { isEqual, uniq } from 'lodash';
import {
  ColumnType,
  DeepPartial,
  EntityManager,
  EntityMetadata,
  FindOptionsWhere,
  ObjectLiteral,
  SelectQueryBuilder,
  type FindManyOptions,
  type UpdateResult,
} from 'typeorm';

export abstract class CRUDService<
  Entity extends ObjectLiteral,
> extends TypeOrmCrudService<Entity> {
  public async updateOne(req: CrudRequest, dto: DeepPartial<Entity>) {
    const { allowParamsOverride, returnShallow } =
      req.options.routes?.updateOneBase ?? {};
    const paramsFilters = this.getParamFilters(req.parsed);
    const found = await this.getOneOrFail(req, returnShallow);

    const toSave = !allowParamsOverride
      ? this.repo.merge(
          this.repo.create(),
          found,
          dto,
          paramsFilters as never,
          req.parsed.authPersist as never,
        )
      : this.repo.merge(
          this.repo.create(),
          found,
          dto,
          req.parsed.authPersist as never,
        );

    const updated = await this.repo.save(toSave);

    if (returnShallow) {
      return updated;
    }

    req.parsed.paramsFilter.forEach((filter) => {
      filter.value = updated[filter.field as never];
    });

    return this.getOneOrFail(req);
  }

  public createQueryBuilder(alias = this.alias) {
    return this.repo.createQueryBuilder(alias);
  }

  public getAlias() {
    return this.alias;
  }

  public updateSession(entity: Entity) {
    const previousState = JSON.parse(JSON.stringify(entity));

    return {
      save: async (entityManager?: EntityManager) => {
        const updates: Record<string, unknown> = {};

        for (const key of uniq([
          ...Object.keys(entity as Record<string, unknown>),
          ...Object.keys(previousState),
        ])) {
          if (
            !isEqual(
              (entity as Record<string, unknown>)[key],
              previousState[key],
            )
          ) {
            updates[key] = (entity as Record<string, unknown>)[key];
          }
        }

        this.removeReadonlyFields(updates);

        await this.updateWhere(
          this.getPrimaryCondition(entity),
          updates as Omit<Partial<Entity>, 'id'>,
          entityManager,
        );

        return entity;
      },
    } as { save: (entityManager?: EntityManager) => Promise<Entity> };
  }

  public async updateWhere(
    condition: FindOptionsWhere<Entity>,
    updates: Omit<Partial<Entity>, 'id'>,
    entityManager?: EntityManager,
  ): Promise<UpdateResult> {
    if (entityManager) {
      return entityManager.update(this.entityType, condition, updates as never);
    }

    return this.repo.update(condition, updates as never);
  }

  public async updateEntry(
    entity: Entity,
    updates: Omit<Partial<Entity>, 'id'>,
    entityManager?: EntityManager,
  ) {
    this.removeReadonlyFields(updates as Record<string, unknown>);

    await this.updateWhere(
      this.getPrimaryCondition(entity),
      updates,
      entityManager,
    );

    return Object.assign(entity as object, updates);
  }

  protected getSelect(query: ParsedRequestParams, options: QueryOptions) {
    query.fields = query.fields.map((field) => {
      const transformedField = this.transformJsonFieldSearch(field);

      if (transformedField.includes('->')) {
        return transformedField.split('->')[0].replaceAll('"', '');
      }

      return field;
    });

    return uniq(super.getSelect(query, options));
  }

  protected mapSort(sort: QuerySort[]): ObjectLiteral {
    const params: ObjectLiteral = {};

    for (const element of sort) {
      const field = this.transformJsonFieldSearch(element.field);

      if (field === element.field) {
        Object.assign(params, super.mapSort([element]));
      }

      params[this.getFieldWithAlias(field, true)] = element.order;
    }

    return params;
  }

  protected builderSetWhere(
    builder: SelectQueryBuilder<Entity>,
    condition: SConditionKey,
    field: string,
    value: any,
    operator?: ComparisonOperator,
  ) {
    return super.builderSetWhere(
      builder,
      condition,
      this.transformJsonFieldSearch(field),
      value,
      operator,
    );
  }

  protected getFieldWithAlias(field: string, sort?: boolean): string {
    const index = field.indexOf('->');

    if (index === -1) {
      return super.getFieldWithAlias(field, sort);
    }

    let fieldWithAlias = super.getFieldWithAlias(
      field.slice(0, index).replaceAll('"', ''),
      sort,
    );

    fieldWithAlias = fieldWithAlias
      .split('.')
      .map((value) => `"${value}"`)
      .join('.')
      .replaceAll(/"{2,}/g, '"');

    return `${fieldWithAlias}->${field.slice(index + 2)}`;
  }

  protected mapOperatorsToQuery(
    cond: QueryFilter,
    param: any,
  ): { str: string; params: ObjectLiteral } {
    const normalized = String(param)
      .replaceAll('->>', '.')
      .replaceAll('->', '.')
      .replaceAll('"', '')
      .replaceAll("'", '');

    return super.mapOperatorsToQuery(cond, normalized);
  }

  protected runInTransaction<T>(
    fn: (entityManager: EntityManager) => Promise<T>,
    entityManager?: EntityManager,
  ): Promise<T> {
    if (entityManager) {
      return fn(entityManager);
    }

    return this.repo.manager.transaction(fn);
  }

  private getPrimaryCondition(entity: Entity): FindOptionsWhere<Entity> {
    const primaryColumns = this.repo.metadata.primaryColumns;

    if (primaryColumns.length === 0) {
      throw new Error(
        `${this.repo.metadata.name} does not have a primary column configured`,
      );
    }

    return primaryColumns.reduce<Record<string, unknown>>(
      (condition, column) => {
        const value = (entity as Record<string, unknown>)[column.propertyName];

        if (value === undefined) {
          throw new Error(
            `Primary key "${column.propertyName}" is missing on ${this.repo.metadata.name}`,
          );
        }

        condition[column.propertyName] = value;
        return condition;
      },
      {},
    ) as FindOptionsWhere<Entity>;
  }

  private removeReadonlyFields(updates: Record<string, unknown>) {
    delete updates.createdAt;
    delete updates.updatedAt;

    for (const column of this.repo.metadata.primaryColumns) {
      delete updates[column.propertyName];
    }
  }

  private transformJsonFieldSearch(field: string) {
    let fieldParts = field.split('.');

    if (fieldParts.length < 2) {
      return field;
    }

    let hasJsonColumn = false;
    let metadata: EntityMetadata | false | null = null;
    const newFieldParts: string[] = [];
    let lastColumnName = '';

    for (let i = 0; i < fieldParts.length; i += 1) {
      const columnName = fieldParts[i];

      if (metadata == null) {
        metadata = this.repo.metadata;
      } else if (metadata !== false) {
        const relation = metadata.relations.find(
          (item) => item.propertyName === lastColumnName,
        );

        metadata = relation?.inverseEntityMetadata ?? false;
      }

      const isJsonColumn =
        metadata &&
        metadata.ownColumns.some(
          (column) =>
            column.propertyName === columnName &&
            JSON_COLUMN_TYPES.includes(column.type),
        );

      newFieldParts.push(`"${columnName}"`);
      lastColumnName = columnName;

      if (isJsonColumn) {
        fieldParts = fieldParts.slice(i + 1);
        hasJsonColumn = true;
        break;
      }
    }

    let newField = newFieldParts.join('.');

    if (!hasJsonColumn) {
      return field;
    }

    const lastProperty = fieldParts.pop();

    if (!lastProperty) {
      return newField;
    }

    for (const fieldPart of fieldParts) {
      newField += `->'${fieldPart}'`;
    }

    return `${newField}->>'${lastProperty}'`;
  }

  public async exists(options?: FindManyOptions<Entity>): Promise<boolean> {
    return this.repo.exists(options);
  }
}

export abstract class CRUDController<
  Entity extends ObjectLiteral,
  Service extends CRUDService<Entity>,
> implements CrudController<Entity> {
  protected constructor(public readonly service: Service) {}

  protected get crud(): CrudController<Entity> {
    return this;
  }
}

const JSON_COLUMN_TYPES: ColumnType[] = ['json', 'jsonb', 'simple-json'];

export {
  CrudConfigService as CRUDConfigService,
  CrudRequestInterceptor as CRUDRequestInterceptor,
  Override as CRUDOverride,
  ParsedRequest as CRUDParsedRequest,
};

export type {
  CrudRequest as CRUDRequest,
  GetManyDefaultResponse as CRUDGetManyDefaultResponse,
  QueryOptions as CRUDQueryOptions,
} from '@nestjsx/crud';

export type { ParsedRequestParams as CRUDParsedRequestParams } from '@nestjsx/crud-request';

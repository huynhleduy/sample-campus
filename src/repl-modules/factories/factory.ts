import { type INestApplicationContext } from '@nestjs/common';
import {
  DataSource,
  type EntityTarget,
  type ObjectLiteral,
  type Repository,
} from 'typeorm';

let typeormDataSource: DataSource | null = null;
let appModule: INestApplicationContext | null = null;
let store: FactoryStore = {};

export class Factory {
  static forEntity<Entity extends ObjectLiteral>(
    entity: EntityTarget<Entity>,
    formatter: EntityFactoryInputFormatter<Entity> = async (input) => input,
    dependencies: Array<keyof Entity> = [],
  ): EntityFactory<Entity> {
    async function format(
      input: Partial<Entity> | Partial<Entity>[],
      cleanUp: boolean,
      repository: Repository<Entity>,
      dataSource: DataSource,
    ): Promise<Partial<Entity> | Partial<Entity>[]> {
      if (Array.isArray(input)) {
        const result: Partial<Entity>[] = [];

        for (const item of input) {
          result.push(
            (await format(item, cleanUp, repository, dataSource)) as Partial<Entity>,
          );
        }

        return result;
      }

      const formattedInput = await formatter(
        { ...input },
        repository,
        dataSource,
        appModule,
        store,
      );

      if (cleanUp) {
        for (const dependency of dependencies) {
          formattedInput[dependency] = undefined;
        }
      }

      return formattedInput;
    }

    const entityFactory: EntityFactory<Entity> = async <
      Input extends Partial<Entity> | Partial<Entity>[] | boolean | number = Partial<Entity>,
    >(
      input: Input = {} as Input,
      cleanUp = true,
    ) => {
      if (typeormDataSource == null) {
        throw new Error(
          'Factory module is not initialized. Call Factory.setModule() first.',
        );
      }

      let normalizedInput: Partial<Entity> | Partial<Entity>[];

      switch (typeof input) {
        case 'boolean':
          cleanUp = input;
          normalizedInput = {};
          break;
        case 'number':
          normalizedInput = Array.from({ length: input }, () => ({}));
          break;
        default:
          normalizedInput = input as Partial<Entity> | Partial<Entity>[];
      }

      const repository = typeormDataSource.getRepository(entity);
      const formattedInput = await format(
        normalizedInput,
        cleanUp,
        repository,
        typeormDataSource,
      );

      const saved = await repository
        .save(formattedInput as Entity)
        .catch(async (error: { code?: string }) => {
          if (
            error.code === '23505' &&
            formattedInput != null &&
            !Array.isArray(formattedInput)
          ) {
            return repository.findOneByOrFail(formattedInput);
          }

          throw error;
        });

      return repository.create(saved) as Input extends Array<unknown> | number
        ? Entity[]
        : Entity;
    };

    return entityFactory;
  }

  static setModule(inputModule: INestApplicationContext) {
    appModule = inputModule;
    typeormDataSource = appModule.get(DataSource);
  }

  static resetModule() {
    appModule = null;
    typeormDataSource = null;
  }

  static resetStore() {
    store = {};
  }
}

export type EntityFactory<Entity extends ObjectLiteral> = <
  Input extends Partial<Entity> | Partial<Entity>[] | boolean | number = Partial<Entity>,
>(
  input?: Input,
  cleanUp?: boolean,
) => Promise<Input extends Array<unknown> | number ? Entity[] : Entity>;

export type EntityFactoryInputFormatter<Entity extends ObjectLiteral> = (
  input: Partial<Entity>,
  repository: Repository<Entity>,
  dataSource: DataSource,
  appModule: INestApplicationContext | null,
  store: FactoryStore,
) => Promise<Partial<Entity>>;

export type FactoryStore = Record<string, Set<unknown>>;

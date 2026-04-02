import {
  type ModuleMetadata,
  Logger,
  type Provider,
  type Type,
} from '@nestjs/common';
import {
  Test,
  type TestingModule,
  type TestingModuleBuilder,
} from '@nestjs/testing';
import { useContainer } from 'class-validator';
import {
  ExpressAdapter,
  type NestExpressApplication,
} from '@nestjs/platform-express';
import { initializeTransactionalContext } from 'typeorm-transactional';
import { Factory } from '@src/repl-modules/factories/factory';
import { SHOULD_DEBUG } from './common';

export let testingModule: TestingModule | null = null;
export let testingApp: NestExpressApplication | null = null;

export async function createTestingModule(
  options: TestingContextOptions = {},
): Promise<TestingModule> {
  return createModule(options).then((module) => module.init());
}

export async function createTestingApp(
  options: TestingContextOptions = {},
): Promise<NestExpressApplication> {
  initializeTransactionalContext();
  await createModule(options);

  testingApp =
    testingModule!.createNestApplication<NestExpressApplication>(
      new ExpressAdapter(),
    );

  const { AppModule } = await import('@src/app.module');
  const bootstrapConfig = (await import('@src/common/configs/boostrap-config'))
    .default;

  useContainer(testingApp.select(AppModule), { fallbackOnErrors: true });

  testingApp.enableShutdownHooks();

  await bootstrapConfig(testingApp);
  await testingApp.init();

  return testingApp;
}

export async function destroyTestingModule(): Promise<void> {
  if (testingModule == null) {
    return;
  }

  if (SHOULD_DEBUG) {
    console.time('destroyTestingModule');
  }

  if (testingApp != null) {
    await testingApp.close();
  } else {
    await testingModule.close();
  }

  Factory.resetModule();
  testingApp = null;
  testingModule = null;

  if (SHOULD_DEBUG) {
    console.timeEnd('destroyTestingModule');
  }
}

async function createModule(
  options: TestingContextOptions = {},
): Promise<TestingModule> {
  if (SHOULD_DEBUG) {
    console.time('createModule');
  }

  await destroyTestingModule();

  const { AppModule } = await import('@src/app.module');

  const moduleBuilder = Test.createTestingModule({
    imports: [AppModule, ...(options.imports ?? [])],
    providers: options.providers,
  });

  options.configure?.(moduleBuilder);
  applyProviderOverrides(moduleBuilder, options.overrideProviders ?? []);

  testingModule = await moduleBuilder.compile();

  testingModule.enableShutdownHooks();
  testingModule.useLogger(SHOULD_DEBUG ? new Logger() : false);
  Factory.setModule(testingModule);

  if (SHOULD_DEBUG) {
    console.timeEnd('createModule');
  }

  return testingModule;
}

function applyProviderOverrides(
  moduleBuilder: TestingModuleBuilder,
  overrides: TestingProviderOverride[],
) {
  for (const override of overrides) {
    const providerOverride = moduleBuilder.overrideProvider(override.provider);

    if ('useValue' in override) {
      providerOverride.useValue(override.useValue);
      continue;
    }

    if ('useFactory' in override) {
      providerOverride.useFactory({
        factory: override.useFactory,
        inject: override.inject,
      });
      continue;
    }

    if ('useClass' in override) {
      providerOverride.useClass(override.useClass);
    }
  }
}

export type TestingContextOptions = {
  imports?: Exclude<ModuleMetadata['imports'], undefined>;
  providers?: Provider[];
  overrideProviders?: TestingProviderOverride[];
  configure?: (builder: TestingModuleBuilder) => void;
};

type TestingProviderOverride =
  | {
      provider: Type<unknown> | string | symbol;
      useValue: unknown;
    }
  | {
      provider: Type<unknown> | string | symbol;
      useClass: Type<unknown>;
    }
  | {
      provider: Type<unknown> | string | symbol;
      useFactory: (...args: unknown[]) => unknown;
      inject?: Array<Type<unknown> | string | symbol>;
    };

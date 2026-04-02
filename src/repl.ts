import Repl from 'node:repl';
import { NestFactory } from '@nestjs/core';
import * as factory from '@src/repl-modules/factories';
import { Factory } from '@src/repl-modules/factories/factory';
import { SeederService } from './repl-modules';
import { ReplModule } from './repl-modules/repl.module';
import { ReplService } from './repl-modules/repl.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(ReplModule);
  const replService = app.get(ReplService);
  const seederService = app.get(SeederService);

  Factory.setModule(app);

  const repl = Repl.start({
    prompt: 'SampleCampus> ',
    useGlobal: true,
  });

  repl.setupHistory('.sample-campus_repl_history', () => undefined);

  repl.context.app = app;
  repl.context.factory = factory;
  repl.context.replService = replService;
  repl.context.seederService = seederService;

  repl.on('exit', async () => {
    Factory.resetModule();
    await app.close();
  });
}

void bootstrap();

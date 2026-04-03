import { Module } from '@nestjs/common';
import { AppModule } from '@src/app.module';
import { ReplService } from './repl.service';
import { SeederModule } from './seeder';

@Module({
  imports: [AppModule, SeederModule],
  providers: [ReplService],
})
export class ReplModule {}

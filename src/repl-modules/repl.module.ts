import { Module } from '@nestjs/common';
import { AppModule } from '@src/app.module';
import { SeederModule } from './seeder';
import { ReplService } from './repl.service';

@Module({
  imports: [AppModule, SeederModule],
  providers: [ReplService],
})
export class ReplModule {}

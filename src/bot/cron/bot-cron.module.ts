import { Module } from '@nestjs/common';
import { BotCronService } from './bot-cron.service';

@Module({
  imports: [],
  providers: [BotCronService],
})
export class BotCronModule {}

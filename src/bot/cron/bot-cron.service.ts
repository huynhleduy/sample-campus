import { Injectable } from '@nestjs/common';
// import { CleaningCronService } from '@src/modules/schedule/services/cleaning-cron.service';
// import { OpentalkCronService } from '@src/modules/schedule/services/opentalk-cron.service';

@Injectable()
export class BotCronService {
  // Cron jobs have been moved to CronService
  // This service is kept for future bot-specific cron jobs
  constructor() {}
}

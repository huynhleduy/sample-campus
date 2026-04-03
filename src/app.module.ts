import { Logger, Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule as NestScheduleModule } from '@nestjs/schedule';
import { MezonClient } from 'mezon-sdk';
import { DatabaseModule } from '@src/common/database/database.module';
import { AppConfigService } from '@src/common/shared/services/app-config.service';
import { SharedModule } from '@src/common/shared/shared.module';
import { NezonModule } from '@src/libs/nezon';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';

@Module({
  imports: [
    SharedModule,
    DatabaseModule,
    NezonModule.forRootAsync({
      inject: [AppConfigService],
      useFactory: async (config: AppConfigService) => config.botConfig,
    }),
    EventEmitterModule.forRoot(),
    NestScheduleModule.forRoot(),
    UserModule,
    AuthModule,
  ],
  providers: [],
})
export class AppModule {
  constructor(private mezonClient: MezonClient) {
    this.mezonClient.on('ready', async () => {
      Logger.log('🤖 Mezon Client is ready!');
    });
  }
}

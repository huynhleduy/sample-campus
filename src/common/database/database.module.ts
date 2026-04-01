import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppConfigService } from 'src/common/shared/services/app-config.service';
import { SharedModule } from 'src/common/shared/shared.module';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [SharedModule],
      useFactory: (configService: AppConfigService) =>
        configService.postgresConfig,
      inject: [AppConfigService],
    }),
  ],
})
export class DatabaseModule {}

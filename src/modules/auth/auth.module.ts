import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AppConfigService } from '@src/common/shared/services/app-config.service';
import { UserModule } from '@src/modules/user/user.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      useFactory: (appConfigService: AppConfigService) => ({
        secret: appConfigService.jwtConfig.secret,
        signOptions: { expiresIn: '15m' },
      }),
      inject: [AppConfigService],
    }),
    UserModule,
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}

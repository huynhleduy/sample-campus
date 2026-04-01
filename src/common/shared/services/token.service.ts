/* eslint-disable no-secrets/no-secrets */
import { Injectable } from '@nestjs/common';

@Injectable()
export class TokenService {
  constructor() {} // private jwtService: JwtService, // private configService: AppConfigService,
  // decodeJwtToken<T>(token: string): T {
  //   return this.jwtService.decode<T>(token);
  // }
  // generateAccessToken(payload: UserAuth): string {
  //   return this.jwtService.sign(payload, {
  //     secret: this.configService.authConfig.accessTokenSecret,
  //     expiresIn: this.configService.authConfig.jwtExpirationTime,
  //   });
  // }

  // generateRefreshToken(payload: RefreshTokenPayload): string {
  //   return this.jwtService.sign(payload, {
  //     secret: this.configService.authConfig.refreshTokenSecret,
  //     expiresIn: this.configService.authConfig.jwtRefreshExpirationTime,
  //   });
  // }

  // generateRecoveryToken(payload: RecoveryTokenPayload): string {
  //   return this.jwtService.sign(payload, {
  //     secret: this.configService.authConfig.recoveryTokenSecret,
  //     expiresIn: this.configService.authConfig.jwtExpirationTime,
  //   });
  // }

  // verifyAccessToken(token: string): UserAuth {
  //   return this.jwtService.verify(token, {
  //     secret: this.configService.authConfig.accessTokenSecret,
  //   });
  // }

  // verifyRefreshToken(token: string): RefreshTokenPayload {
  //   return this.jwtService.verify(token, {
  //     secret: this.configService.authConfig.refreshTokenSecret,
  //   });
  // }

  // verifyRecoveryToken(token: string): RecoveryTokenPayload {
  //   return this.jwtService.verify(token, {
  //     secret: this.configService.authConfig.recoveryTokenSecret,
  //   });
  // }
}

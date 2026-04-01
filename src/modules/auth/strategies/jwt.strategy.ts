import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { AppConfigService } from '@src/common/shared/services/app-config.service';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(appConfigService: AppConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: appConfigService.jwtConfig.secret,
    });
  }

  async validate(payload) {
    return payload;
  }
}

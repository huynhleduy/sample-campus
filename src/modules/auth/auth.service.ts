import { BadRequestException, Injectable } from '@nestjs/common';
import { AppConfigService } from '@src/common/shared/services/app-config.service';
import UserEntity from '@src/modules/user/user.entity';
import { UserService } from '../user/user.service';

export interface ExchangeCodeData {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

export interface UserInfoData {
  avatar: string;
  display_name: string;
  email: string;
  user_id: string;
}

@Injectable()
export class AuthService {
  constructor(
    private appConfigService: AppConfigService,
    private userService: UserService,
  ) {}

  async exchangeCode(code: string, state: string): Promise<ExchangeCodeData> {
    const oauthConfig = this.appConfigService.oauthConfig;
    const res = await fetch(`${oauthConfig.baseUri}/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        state,
        client_id: oauthConfig.clientId,
        client_secret: oauthConfig.clientSecret,
        redirect_uri: oauthConfig.redirectUri,
        scope: 'openid offline',
      }),
    });

    if (!res.ok) {
      throw new BadRequestException('Failed to exchange code for token');
    }

    const data: ExchangeCodeData = await res.json();
    return data;
  }

  async refreshToken(): Promise<ExchangeCodeData> {
    throw new BadRequestException('Refresh token flow is not implemented');
  }

  async userInfo(accessToken: string): Promise<UserInfoData> {
    const oauthConfig = this.appConfigService.oauthConfig;
    const userRes = await fetch(`${oauthConfig.baseUri}/userinfo`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        access_token: encodeURIComponent(accessToken),
        client_id: oauthConfig.clientId,
        client_secret: oauthConfig.clientSecret,
        redirect_uri: oauthConfig.redirectUri,
      }),
    });

    if (!userRes.ok) {
      throw new BadRequestException('Failed to fetch user info');
    }

    const data: UserInfoData = await userRes.json();
    return data;
  }

  getOauthUrl(): string {
    const oauthConfig = this.appConfigService.oauthConfig;
    const params = new URLSearchParams({
      client_id: oauthConfig.clientId,
      redirect_uri: oauthConfig.redirectUri,
      response_type: 'code',
      scope: 'openid offline',
      state: crypto.randomUUID().substring(0, 10),
    });

    return `${oauthConfig.baseUri}/oauth2/auth?${params.toString()}`;
  }

  async handleOAuthExchange(): Promise<ExchangeCodeData> {
    throw new BadRequestException('OAuth exchange is not implemented');
  }

  async handleRefreshToken(refreshToken: string): Promise<ExchangeCodeData> {
    if (!refreshToken) {
      throw new BadRequestException('No refresh token provided');
    }
    throw new BadRequestException('Token refresh is not implemented');
  }

  async validateUser(userId: string): Promise<UserEntity | null> {
    return this.userService.findById(userId);
  }
}

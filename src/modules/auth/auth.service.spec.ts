import { BadRequestException } from '@nestjs/common';
import { AuthService } from '@src/modules/auth/auth.service';
import {
  createTestingModule,
  mockFetchJsonOnce,
  mockedFetch,
  testingModule,
} from '#jest';

describe(AuthService.name, () => {
  beforeAll(createTestingModule);

  it('uses mocked fetch to exchange an oauth code', async () => {
    mockFetchJsonOnce({
      access_token: 'access-token',
      refresh_token: 'refresh-token',
      expires_in: 900,
      token_type: 'Bearer',
    });

    const authService = testingModule!.get(AuthService);

    await expect(
      authService.exchangeCode('code-1', 'state-1'),
    ).resolves.toEqual({
      access_token: 'access-token',
      refresh_token: 'refresh-token',
      expires_in: 900,
      token_type: 'Bearer',
    });

    expect(mockedFetch).toHaveBeenCalledWith(
      'https://oauth.example.test/oauth2/token',
      expect.objectContaining({
        method: 'POST',
      }),
    );
  });

  it('fails fast when a third-party oauth call is not successful', async () => {
    mockFetchJsonOnce(
      {
        error: 'invalid_request',
      },
      {
        ok: false,
        status: 400,
        statusText: 'Bad Request',
      },
    );

    const authService = testingModule!.get(AuthService);

    await authService.userInfo('bad-token').then(
      () => {
        throw new Error('Expected userInfo to reject for a failed oauth call');
      },
      (error: unknown) => {
        expect(error).toBeInstanceOf(BadRequestException);
        expect((error as BadRequestException).message).toBe(
          'Failed to fetch user info',
        );
      },
    );
  });
});

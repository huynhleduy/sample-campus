import { JwtService } from '@nestjs/jwt';
import { http, createTestingApp, testingModule } from '#jest';

describe('AuthController (e2e)', () => {
  beforeAll(createTestingApp);

  it('returns the configured OAuth URL', async () => {
    const response = await http().get('/auth/oauth/url').expect(200);

    expect(response.body).toMatchObject({
      data: {
        url: expect.stringContaining(
          'https://oauth.example.test/oauth2/auth?',
        ),
      },
      statusCode: 200,
    });
    expect(response.body.data.url).toContain('client_id=test-client-id');
  });

  it('returns the JWT payload for an authenticated request', async () => {
    const jwtService = testingModule!.get(JwtService);
    const token = await jwtService.signAsync({
      sub: 'user-1',
      email: 'tester@example.com',
    });

    await http()
      .get('/auth/profile')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body).toMatchObject({
          data: {
            email: 'tester@example.com',
            sub: 'user-1',
            iat: expect.any(Number),
            exp: expect.any(Number),
          },
          statusCode: 200,
        });
      });
  });
});

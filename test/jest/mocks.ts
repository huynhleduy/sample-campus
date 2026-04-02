const unmockedFetch = jest.fn(async (input?: string | URL | Request) => {
  const url =
    typeof input === 'string'
      ? input
      : input instanceof URL
        ? input.toString()
        : input?.url ?? 'unknown-url';

  throw new Error(
    `Unexpected outbound fetch in test environment: ${url}. Mock it explicitly.`,
  );
});

Object.defineProperty(globalThis, 'fetch', {
  configurable: true,
  writable: true,
  value: unmockedFetch,
});

// Third-party integrations must be mocked in tests. `mezon-sdk` is routed to
// `test/mocks/mezon-sdk/**` via Jest moduleNameMapper, so runtime SDK code is
// never loaded during unit/e2e tests.

jest.mock('@src/common/configs/swagger.config', () => ({
  swaggerConfig: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@aws-sdk/client-s3', () => ({
  GetObjectCommand: class GetObjectCommand {
    constructor(public readonly input: unknown) {}
  },
  PutObjectCommand: class PutObjectCommand {
    constructor(public readonly input: unknown) {}
  },
  S3Client: class MockS3Client {
    readonly send = jest.fn();
  },
}));

jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest
    .fn()
    .mockResolvedValue('https://s3.example.test/presigned-url'),
}));

export { unmockedFetch };

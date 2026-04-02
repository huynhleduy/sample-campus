import { unmockedFetch } from '../mocks';

export const mockedFetch = globalThis.fetch as jest.MockedFunction<
  typeof globalThis.fetch
>;

export function resetExternalMocks() {
  mockedFetch.mockReset();
  mockedFetch.mockImplementation(unmockedFetch);
}

export function mockFetchJsonOnce<T>(
  data: T,
  options: {
    ok?: boolean;
    status?: number;
    statusText?: string;
  } = {},
) {
  const {
    ok = true,
    status = ok ? 200 : 500,
    statusText = ok ? 'OK' : 'Internal Server Error',
  } = options;

  mockedFetch.mockResolvedValueOnce({
    ok,
    status,
    statusText,
    json: async () => data,
    text: async () => JSON.stringify(data),
  } as Response);
}

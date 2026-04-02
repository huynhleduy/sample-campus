const createAsyncMock = <T extends (...args: any[]) => Promise<any>>(
  implementation: T,
) => jest.fn(implementation);

const mezonSdkMethodMocks = {
  login: createAsyncMock(async () => undefined),
  onChannelMessage: createAsyncMock(async () => undefined),
  sendToken: createAsyncMock(
    async () =>
      ({
        ok: true,
        tx_hash: 'mock-tx-hash',
        error: '',
      }) as const,
  ),
  fetchChannel: createAsyncMock(async (id: string) => ({ id })),
  fetchClan: createAsyncMock(async (id: string) => ({ id })),
  fetchUser: createAsyncMock(async (id: string) => ({ id })),
  fetchChannelMessage: createAsyncMock(async (id: string) => ({ id })),
  fetchClanChannel: createAsyncMock(async (id: string) => ({ id })),
  replyMessage: createAsyncMock(async () => undefined),
  closeSocket: jest.fn(),
};

function resetMezonSdkMethodMocks() {
  mezonSdkMethodMocks.login.mockReset();
  mezonSdkMethodMocks.login.mockResolvedValue(undefined);

  mezonSdkMethodMocks.onChannelMessage.mockReset();
  mezonSdkMethodMocks.onChannelMessage.mockResolvedValue(undefined);

  mezonSdkMethodMocks.sendToken.mockReset();
  mezonSdkMethodMocks.sendToken.mockResolvedValue({
    ok: true,
    tx_hash: 'mock-tx-hash',
    error: '',
  });

  mezonSdkMethodMocks.fetchChannel.mockReset();
  mezonSdkMethodMocks.fetchChannel.mockImplementation(async (id: string) => ({
    id,
  }));

  mezonSdkMethodMocks.fetchClan.mockReset();
  mezonSdkMethodMocks.fetchClan.mockImplementation(async (id: string) => ({
    id,
  }));

  mezonSdkMethodMocks.fetchUser.mockReset();
  mezonSdkMethodMocks.fetchUser.mockImplementation(async (id: string) => ({
    id,
  }));

  mezonSdkMethodMocks.fetchChannelMessage.mockReset();
  mezonSdkMethodMocks.fetchChannelMessage.mockImplementation(
    async (id: string) => ({ id }),
  );

  mezonSdkMethodMocks.fetchClanChannel.mockReset();
  mezonSdkMethodMocks.fetchClanChannel.mockImplementation(
    async (id: string) => ({ id }),
  );

  mezonSdkMethodMocks.replyMessage.mockReset();
  mezonSdkMethodMocks.replyMessage.mockResolvedValue(undefined);

  mezonSdkMethodMocks.closeSocket.mockReset();
}

resetMezonSdkMethodMocks();

export { mezonSdkMethodMocks, resetMezonSdkMethodMocks };

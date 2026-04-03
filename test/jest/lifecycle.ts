import {
  resetAfterAll,
  resetAfterEach,
  resetBeforeEach,
} from './utils/lifecycle';
import { resetMezonSdkMocks } from '../mocks/mezon-sdk';

beforeEach(async () => {
  await resetBeforeEach();
  resetMezonSdkMocks();
});
afterEach(resetAfterEach, 20_000);
afterAll(resetAfterAll);

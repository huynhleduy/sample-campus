import { resetMezonSdkMocks } from '../mocks/mezon-sdk';
import {
  resetAfterAll,
  resetAfterEach,
  resetBeforeEach,
} from './utils/lifecycle';

beforeEach(async () => {
  await resetBeforeEach();
  resetMezonSdkMocks();
});
afterEach(resetAfterEach, 20_000);
afterAll(resetAfterAll);

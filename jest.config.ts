import { type Config } from 'jest';
import BaseConfig from '../jest.config';

export default {
  ...BaseConfig,
  displayName: 'Sample Campus',
  moduleNameMapper: {
    ...BaseConfig.moduleNameMapper,
    '^@src/(.*)$': '<rootDir>/src/$1',
    '^src/(.*)$': '<rootDir>/src/$1',
    '^@nezon$': '<rootDir>/src/libs/nezon/index.ts',
    '^mezon-sdk$': '<rootDir>/test/mocks/mezon-sdk/index.ts',
    '^mezon-sdk/dist/cjs/(.*)$': '<rootDir>/test/mocks/mezon-sdk/$1',
  },
  watchman: false,
} satisfies Config;

import type { Config } from '@jest/types';

export const baseJestConfig: Config.InitialOptions = {
  preset: 'ts-jest',
  clearMocks: true,
  coverageDirectory: 'coverage',
  testMatch: ['<rootDir>/src/**/*.spec.(ts|tsx)'],
  moduleDirectories: ['node_modules', '<rootDir>/src'],
  testEnvironment: 'jsdom',
};

const config: Config.InitialOptions = {
  ...baseJestConfig,
};

export default config;

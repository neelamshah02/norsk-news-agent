import type { Config } from 'jest';
import nextJest from 'next/jest.js';

const createJestConfig = nextJest({ dir: './' });

const config: Config = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^cheerio$': '<rootDir>/node_modules/cheerio/dist/commonjs/index.js',
  },
};

export default createJestConfig(config);

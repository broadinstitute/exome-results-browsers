module.exports = {
  roots: ['<rootDir>/src'],
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/browsers/jest.setup.ts'],
  testMatch: ['<rootDir>/src/**/*.test.{ts,tsx}'],
  moduleNameMapper: {
    '\\.md$': '<rootDir>/src/browsers/testUtils/markdownStub.ts',
    '\\.(gif|jpg|png|svg)$': '<rootDir>/src/browsers/testUtils/fileStub.ts',
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { isolatedModules: true }],
  },
}

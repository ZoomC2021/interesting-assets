module.exports = {
  roots: ['<rootDir>'],
  testEnvironment: 'jsdom',
  testMatch: ['**/__tests__/**/*.test.{js,jsx,ts,tsx}'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  // Ensure we use the local React version
  moduleDirectories: ['node_modules', '<rootDir>/node_modules'],
  // Transform all node_modules that might have different React versions
  transformIgnorePatterns: [
    '/node_modules/(?!(react|react-dom|@testing-library)/)',
  ],
};

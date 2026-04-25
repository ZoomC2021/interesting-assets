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
  // Transform ESM-only packages (react-markdown v9+ and its transitive deps
  // from the unified/remark/micromark ecosystem) so Jest can parse them.
  transformIgnorePatterns: [
    '/node_modules/(?!(' +
      [
        'react',
        'react-dom',
        '@testing-library',
        'react-markdown',
        'remark-.*',
        'rehype-.*',
        'mdast-util-.*',
        'micromark.*',
        'unified',
        'unist-util-.*',
        'hast-util-.*',
        'bail',
        'ccount',
        'character-entities.*',
        'comma-separated-tokens',
        'decode-named-character-reference',
        'devlop',
        'escape-string-regexp',
        'estree-util-.*',
        'html-url-attributes',
        'html-void-elements',
        'is-plain-obj',
        'longest-streak',
        'markdown-table',
        'property-information',
        'space-separated-tokens',
        'stringify-entities',
        'trim-lines',
        'trough',
        'vfile.*',
        'web-namespaces',
        'zwitch',
      ].join('|') +
      ')/)',
  ],
};

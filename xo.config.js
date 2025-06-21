/** @type {import('xo').Options} */
module.exports = {
  // Enable TypeScript and React support
  prettier: false,
  space: true,
  semicolon: true,
  extends: [
    'xo',
    'xo/browser',
    'xo/react'
  ],
  // Rules configuration
  rules: {
    'react/react-in-jsx-scope': 'off', // For React automatic JSX runtime
    'no-async-promise-executor': 'warn',
    '@typescript-eslint/no-unused-expressions': ['error', {allowShortCircuit: true, allowTernary: true}]
  },
  // Type checking with TypeScript
  typescript: {},
  // Specific overrides for different file patterns
  overrides: [
    {
      // Relax rules for definition files and tests
      files: ['**/*.d.ts', '**/*.test.ts', '**/*.test.tsx', '**/__tests__/**/*.ts', '**/__tests__/**/*.tsx'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off'
      }
    },
    {
      // Allow unused expressions in route files
      files: ['**/app/**/route.ts', '**/app/**/page.tsx', '**/pages/**/*.tsx'],
      rules: {
        '@typescript-eslint/no-unused-expressions': 'off'
      }
    }
  ],
  // React settings
  settings: {
    react: {
      version: 'detect',
      runtime: 'automatic'
    }
  }
};

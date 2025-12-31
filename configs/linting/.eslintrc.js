module.exports = {
  root: true,
  env: {
    node: true,
    es2022: true
  },
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended'
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  plugins: [
    '@typescript-eslint'
  ],
  rules: {
    // Prevent loose files and enforce organization
    'no-console': 'warn',
    'no-hardcoded-values': 'error',
    'no-absolute-paths': 'error',

    // Custom rules for organization
    'no-root-files': 'error',
    'require-vendor-solutions': 'warn'
  },
  overrides: [
    {
      files: ['scripts/**/*.js', 'scripts/**/*.cjs'],
      rules: {
        'no-console': 'off',
        'no-hardcoded-values': 'warn'
      }
    },
    {
      files: ['**/*.ts'],
      rules: {
        '@typescript-eslint/no-unused-vars': 'error',
        '@typescript-eslint/explicit-function-return-type': 'warn'
      }
    }
  ],
  ignorePatterns: [
    'node_modules/',
    '.pixi/',
    'dist/',
    'build/',
    'vendor-imports/',
    '.cursor/',
    'logs/',
    'data/',
    'cache-debug-report.json',
    'nuclear-cache-fix.js',
    'final-cache-surgery.js'
  ]
};
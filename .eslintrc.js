module.exports = {
  env: {
    es2020: true,
    node: true,
  },
  extends: ['prettier', 'airbnb-base'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 11,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint', 'prettier'],
  rules: {
    'prettier/prettier': 'error',
    'import/no-unresolved': 0,
    'import/extensions': 0,
    'no-unused-vars': 0,
    'class-methods-use-this': 0,
  },
};

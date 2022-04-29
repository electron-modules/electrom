const { getESLintConfig } = require('@applint/spec');

module.exports = getESLintConfig('react-ts', {
  rules: {
  },
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
    createDefaultProgram: true,
  },
  settings: {
    'import/resolver': {
      // See https://github.com/benmosher/eslint-plugin-import/issues/1396#issuecomment-575727774 for line below
      node: {},
      webpack: {
        config: require.resolve('./webpack.config.js'),
      },
      typescript: {},
    },
    react: {
      version: 'detect', // React version. "detect" automatically picks the version you have installed.
    },
    'import/parsers': {
      '@typescript-eslint/parser': ['.ts', '.tsx'],
    },
  },
  overrides: [
    {
      files: ['src/renderer/**'],
      rules: {
        'react-hooks/rules-of-hooks': 0,
      },
    },
    {
      files: ['src/main/**'],
      rules: {
        'no-mixed-operators': 1,
        'react/jsx-closing-tag-location': 1,
        '@typescript-eslint/no-shadow': 1,
      },
    },
  ],
});

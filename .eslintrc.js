module.exports = {
  extends: ['erb', 'plugin:import/recommended'],
  settings: {
    react: {
      version: 'latest',
    },
  },
  rules: {
    // A temporary hack related to IDE not resolving correct package.json
    'import/no-extraneous-dependencies': 'off',
    // Since React 17 and typescript 4.1 you can safely disable the rule
    'react/react-in-jsx-scope': 'off',
    '@typescript-eslint/no-shadow': 'warn',
    // disable browser compat check
    'compat/compat': 0,
    'promise/catch-or-return': 0,
    // disable for ts
    '@typescript-eslint/no-use-before-define': 0,
    'import/extensions': [
      'error',
      'ignorePackages',
      {
        js: 'never',
        jsx: 'never',
        ts: 'never',
        tsx: 'never',
      },
    ],
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
      files: ['**/lib/**'],
      rules: {
        'react-hooks/rules-of-hooks': 0,
      },
    },
    {
      files: ['**/src/**'],
      rules: {
        'no-mixed-operators': 1,
        'react/jsx-closing-tag-location': 1,
        '@typescript-eslint/no-shadow': 1,
        '@typescript-eslint/indent': 1,
      },
    },
  ],
};

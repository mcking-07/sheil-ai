import { combine, comments, ignores, imports, javascript, jsonc, node, perfectionist, stylistic, test, typescript } from '@antfu/eslint-config';
import { composer } from 'eslint-flat-config-utils';

const comments_config = comments();

const imports_config = imports({
  overrides: {
    'import/consistent-type-specifier-style': ['error', 'prefer-top-level'],
  },
});

const ignores_config = ignores(['node_modules/**', 'npm-shrinkwrap.json', 'incidents/**', '.scratchpad/**', 'sessions/**', 'usage/**']);

const javascript_config = javascript({
  overrides: {
    'no-case-declarations': 'off',
  },
});

const jsonc_config = jsonc({
  overrides: {
    'style/eol-last': 'off',
  },
});

const node_config = node();

const perfectionist_config = composer(perfectionist()).override('antfu/perfectionist/setup', {
  rules: {
    'perfectionist/sort-enums': ['error', { order: 'asc', type: 'natural' }],
    'perfectionist/sort-imports': ['error', {
      groups: [
        'builtin', 'external', 'type', 'internal', 'internal-type', 'parent', 'parent-type', 'sibling', 'sibling-type', 'index', 'index-type', 'side-effect', 'object', 'unknown',
      ],
      newlinesBetween: 'never', order: 'asc', type: 'natural',
    }],
    'perfectionist/sort-interfaces': ['error', { order: 'asc', type: 'natural' }],
    'perfectionist/sort-maps': ['error', { order: 'asc', type: 'natural' }],
    'perfectionist/sort-named-exports': ['error', { order: 'asc', type: 'natural' }],
    'perfectionist/sort-named-imports': ['error', { order: 'asc', type: 'natural' }],
  },
}).toConfigs();

const stylistic_config = stylistic({
  jsx: true,
  semi: true,
  overrides: {
    'antfu/consistent-list-newline': 'off',
    'antfu/if-newline': 'off',
    'antfu/top-level-function': 'off',
    'style/brace-style': 'off',
    'style/multiline-ternary': 'off',
  },
});

const test_config = test({});

const typescript_config = typescript({
  overrides: {
    'antfu/no-top-level-await': 'off',
    'no-console': 'off',
    'style/brace-style': 'off',
    'style/max-statements-per-line': 'off',
  },
});

const config = combine(
  comments_config, ignores_config, imports_config, javascript_config, jsonc_config, node_config,
  perfectionist_config, stylistic_config, test_config, typescript_config,
);

export default config;

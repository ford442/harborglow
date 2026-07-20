import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

export default tseslint.config(
  // Ignore build output and config files
  { ignores: ['dist'] },

  // TypeScript source files
  {
    files: ['src/**/*.{ts,tsx}'],
    extends: [
      ...tseslint.configs.recommended,
    ],
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      // Spread the react-hooks recommended rules
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': 'warn',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      // Prevent @ts-nocheck from hiding duplicate declarations from tsc (see #114, #117).
      '@typescript-eslint/ban-ts-comment': ['error', {
        'ts-nocheck': true,
        'ts-ignore': true,
        'ts-expect-error': 'allow-with-description',
        'ts-check': false,
        minimumDescriptionLength: 10,
      }],
      '@typescript-eslint/no-redeclare': 'error',
    },
  }
)

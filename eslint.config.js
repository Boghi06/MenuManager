import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  // .claude contiene worktree delle sessioni agent: senza ignore
  // typescript-eslint trova più tsconfig root e il lint fallisce ovunque
  globalIgnores(['dist', '.claude']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: {
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    // react-refresh vuole file che esportino solo componenti. Due eccezioni
    // strutturali, non difetti da correggere:
    // - src/core/ui: componenti shadcn generati, che esportano anche le
    //   varianti cva accanto al componente (riscriverli romperebbe il rigenera);
    // - src/modules/*/index.tsx: manifest di modulo (ModuleDefinition), dove i
    //   lazy() delle pagine convivono per forza con l'export della definizione.
    files: ['src/core/ui/**/*.tsx', 'src/modules/*/index.tsx'],
    rules: { 'react-refresh/only-export-components': 'off' },
  },
])

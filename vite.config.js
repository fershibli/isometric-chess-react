import { readFileSync } from 'node:fs'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The release workflow rewrites this field before it builds the site, so the
// deployed page always names the version it was cut from.
const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'))

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: process.env.BASE_PATH || '/',
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  // Vitest transforms JSX with esbuild rather than the React plugin, so the
  // automatic runtime has to be requested for test runs. Builds use oxc and
  // would only warn that these options are ignored.
  ...(mode === 'test' ? { esbuild: { jsx: 'automatic', jsxImportSource: 'react' } } : {}),
  server: {
    host: '0.0.0.0',
    port: 43125,
  },
  preview: {
    host: '0.0.0.0',
    port: 43125,
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
    css: true,
    globals: false,
    include: ['src/**/*.test.{js,jsx}', 'scripts/**/*.test.mjs'],
  },
}))

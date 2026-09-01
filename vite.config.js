import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: process.env.BASE_PATH || '/',
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
    include: ['src/**/*.test.{js,jsx}'],
  },
}))

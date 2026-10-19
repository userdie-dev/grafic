import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [vue()],
  define: { __APP_VERSION__: JSON.stringify('0.0.0-test') },
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  test: {
    environment: 'happy-dom',
    globals: true,
    testTimeout: 30000,
    include: ['tests/**/*.spec.ts'],
    setupFiles: ['tests/setup.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,vue}'],
      // shadcn-vue generated primitives are third-party code; only our two composite pickers are tested
      exclude: ['src/components/ui/badge/**', 'src/components/ui/button/**', 'src/components/ui/calendar/**', 'src/components/ui/card/**', 'src/components/ui/dialog/**', 'src/components/ui/drawer/**', 'src/components/ui/input/**', 'src/components/ui/native-select/**'],
      thresholds: { statements: 100, branches: 100, functions: 100, lines: 100 },
    },
  },
})

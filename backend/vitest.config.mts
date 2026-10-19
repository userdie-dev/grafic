import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [swc.vite({ jsc: { target: 'es2022', parser: { syntax: 'typescript', decorators: true }, transform: { legacyDecorator: true, decoratorMetadata: true } } })],
  test: {
    include: ['test/**/*.spec.ts'],
    globals: true,
    setupFiles: ['test/env.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      thresholds: { statements: 100, branches: 100, functions: 100, lines: 100 },
    },
  },
});

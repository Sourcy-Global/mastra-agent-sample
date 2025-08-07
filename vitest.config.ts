import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: false,
    environment: 'node',
    include: ['**/*.{test,spec}.{js,ts}'],
    exclude: ['node_modules', 'dist', '.mastra'],
    env: {
      OPENAI_API_KEY: 'test-openai-key',
      SERPER_API_KEY: 'test-serper-key',
      SERPER_API_URL: 'https://google.serper.dev',
      API_1688_TOKEN: 'test-1688-token',
      API_1688_BASE_URL: 'http://api.tmapi.top',
      COHERE_API_KEY: 'test-cohere-key'
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '.mastra/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/coverage/**'
      ]
    },
    watchExclude: ['**/node_modules/**', '**/dist/**', '**/.mastra/**']
  }
});
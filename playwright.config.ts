import { defineConfig } from '@playwright/test'

const BROWSERS = ['ASC', 'BipEx', 'BipEx2', 'Epi25', 'SCHEMA', 'IBD', 'GP2'] as const

const BASE_PORT = 8101

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  reporter: 'list',

  webServer: BROWSERS.map((browser, i) => ({
    command: 'node_modules/.bin/ts-node src/server/server.ts',
    url: `http://localhost:${BASE_PORT + i}/ready`,
    reuseExistingServer: !process.env.CI,
    env: {
      ...process.env,
      NODE_ENV: 'development',
      BROWSER: browser,
      RESULTS_DATA_DIRECTORY: 'data/smoke',
      PORT: String(BASE_PORT + i),
    },
  })),

  projects: BROWSERS.map((browser, i) => ({
    name: browser,
    use: { baseURL: `http://localhost:${BASE_PORT + i}` },
  })),
})

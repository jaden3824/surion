import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "../../tests/e2e",
  use: { baseURL: "http://127.0.0.1:3000", trace: "on-first-retry" },
  webServer: {
    command: "pnpm dev",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: true,
    // UI/E2E tests use isolated demo state. Actual database-backed sign-up/session behavior
    // is verified separately against the connected development database.
    env: {
      NEXT_PUBLIC_DEMO_MODE: "true",
      BETTER_AUTH_SECRET: "",
      BETTER_AUTH_URL: "",
      DATABASE_URL: "",
      DATABASE_URL_UNPOOLED: "",
      BLOB_READ_WRITE_TOKEN: "",
    },
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["iPhone 13"] } },
  ],
});

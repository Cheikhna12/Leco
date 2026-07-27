import { defineConfig, devices } from "@playwright/test";

const browserChannel =
  process.env.PLAYWRIGHT_CHANNEL ??
  (process.platform === "win32" ? "msedge" : undefined);
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3107";
const serverUrl = new URL(baseURL);

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: "html",
  workers: 1,
  use: {
    baseURL,
    ...(browserChannel ? { channel: browserChannel } : {}),
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "mobile-chromium",
      use: { ...devices["Pixel 7"] },
    },
    {
      name: "desktop-chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: `npm run dev -- --hostname ${serverUrl.hostname} --port ${serverUrl.port}`,
    env: {
      NEXT_PUBLIC_APP_URL: baseURL,
    },
    reuseExistingServer: false,
    url: baseURL,
  },
});

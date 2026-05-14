import { defineConfig, devices } from "@playwright/test";

/**
 * Configuração Playwright para E2E do módulo Campeonato.
 *
 * Variáveis de ambiente:
 *   PREVIEW_URL                 — URL do preview/produção a testar (default: http://localhost:8080)
 *   SUPABASE_URL                — URL do projeto Supabase de teste (necessário para seed/teardown)
 *   SUPABASE_SERVICE_ROLE_KEY   — Service role key do projeto de teste (NUNCA commitar)
 *
 * Rodar local:
 *   npm run e2e:seed && npm run e2e && npm run e2e:teardown
 */
const PREVIEW_URL = process.env.PREVIEW_URL ?? "http://localhost:8080";

export default defineConfig({
  testDir: "./tests/e2e/campeonato",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : [["list"], ["html", { open: "never" }]],
  timeout: 30_000,
  expect: { timeout: 7_000 },
  use: {
    baseURL: PREVIEW_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "mobile-430",
      use: {
        ...devices["iPhone 14 Pro Max"],
        viewport: { width: 430, height: 761 },
      },
    },
  ],
  // webServer só sobe local quando PREVIEW_URL não foi definido externamente
  webServer: process.env.PREVIEW_URL
    ? undefined
    : {
        command: "bun run dev",
        url: "http://localhost:8080",
        reuseExistingServer: true,
        timeout: 60_000,
      },
});
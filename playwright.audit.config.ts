import { defineConfig } from "@playwright/test";

// Config separada pros smokes da auditoria (não dependem de seed/teardown
// nem de credenciais de motorista, ao contrário de tests/e2e/campeonato).
//
// Rodar:
//   npm run dev                       # em uma aba
//   npm run e2e:smoke                 # em outra
//
// Ou contra preview/produção:
//   PREVIEW_URL=https://preview.app.com npm run e2e:smoke

const PREVIEW_URL = process.env.PREVIEW_URL ?? "http://localhost:8080";

export default defineConfig({
  testDir: "./tests/e2e/audit",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [["github"], ["list"]] : [["list"]],
  timeout: 20_000,
  expect: { timeout: 5_000 },
  use: {
    baseURL: PREVIEW_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
});

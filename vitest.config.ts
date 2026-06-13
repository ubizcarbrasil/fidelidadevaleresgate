import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    // Coverage config — usado pelo CI (`npm test -- --coverage`).
    // Thresholds começam BAIXOS de propósito (~4% atual) e sobem
    // gradual conforme escrevemos mais testes. Quebrar deliberado:
    // PR não pode REGREDIR coverage, mas pode ficar igual.
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      reportsDirectory: "./coverage",
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/*.{test,spec}.{ts,tsx}",
        "src/**/__tests__/**",
        "src/test/**",
        "src/integrations/supabase/types.ts",  // auto-gerado
        "src/**/*.d.ts",
        "src/main.tsx",
        "src/entry-client.ts",
      ],
      // Thresholds atuais (baseline). Subir gradual a cada quarter.
      // CI quebra se cair abaixo.
      thresholds: {
        statements: 3,
        branches: 50,
        functions: 30,
        lines: 3,
      },
    },
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});

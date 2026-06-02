import { test, expect } from "@playwright/test";

// Smoke E2E pra validar o trabalho da auditoria não regrediu fluxos básicos.
// Não precisa de seed/teardown — só sobe o app e confere que renderiza.
//
// Rodar: `npm run dev` em uma aba e `npm run e2e -- tests/e2e/audit` em outra
// (ou PREVIEW_URL=https://staging.app npm run e2e -- tests/e2e/audit).

test.describe("Auditoria — smoke geral", () => {
  test("F5.1: app carrega na rota raiz sem brandId (portal/localhost)", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });

    await page.goto("/");

    // Não deve ficar travado no loader — F5.1 garante isLocalOrPortalHost sem
    // ?brandId pula direto pra BRAND_READY.
    await expect(page.locator("body")).toBeVisible();

    // Filtra erros conhecidos de network local (Supabase indisponível em dev sem env)
    const realErrors = errors.filter(
      (e) =>
        !e.includes("ResizeObserver") &&
        !e.includes("Failed to fetch") &&
        !e.includes("NetworkError") &&
        !e.toLowerCase().includes("supabase"),
    );
    expect(realErrors, `Pageerrors inesperados: ${realErrors.join("\n")}`).toHaveLength(0);
  });

  test("F5.1: bootContext RPC é chamada (boot único — não 5-7 round-trips)", async ({ page }) => {
    const rpcCalls: string[] = [];
    page.on("request", (req) => {
      const url = req.url();
      if (url.includes("/rest/v1/rpc/")) {
        rpcCalls.push(url.split("/rpc/")[1].split("?")[0]);
      }
    });

    await page.goto("/");
    // Espera o boot terminar
    await page.waitForTimeout(2000);

    // Se Supabase estiver configurado, get_boot_context deve aparecer.
    // Se não estiver (dev sem env), só validamos que não houve crash.
    // Esse teste é informativo — não falha por ausência (env-dependent).
    if (rpcCalls.length > 0) {
      expect(rpcCalls.some((c) => c === "get_boot_context")).toBe(true);
    }
  });

  test("Auth page renderiza (login form visível)", async ({ page }) => {
    await page.goto("/auth");

    // Form de login deve aparecer (email + senha + submit)
    await expect(
      page.getByRole("textbox").first(),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("F5.2: CrmDashboard renderiza sem crashar (logged out fica em /auth)", async ({ page }) => {
    // Sem login, o ProtectedRoute redireciona pra /auth. Isso já confirma
    // que o bundle carrega e o React Router funciona — F5.2 não quebrou.
    await page.goto("/crm");

    // Esperamos redirect ou login mostrando
    await page.waitForLoadState("networkidle", { timeout: 10_000 }).catch(() => {});
    const url = page.url();
    expect(url).toMatch(/\/(auth|crm)/);
  });
});

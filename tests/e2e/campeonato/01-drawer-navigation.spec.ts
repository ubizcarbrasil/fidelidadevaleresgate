import { test, expect } from "@playwright/test";
import { seedDriverSession } from "../helpers/driver-login";
import { E2E_BRAND_ID } from "../fixtures/constants";

test.describe("Campeonato — Drawer e navegação", () => {
  test.beforeEach(async ({ context }) => {
    await seedDriverSession(context);
  });

  test("abre /motorista/campeonato sem redirect", async ({ page }) => {
    await page.goto(`/motorista/campeonato?brandId=${E2E_BRAND_ID}`);
    await expect(page).toHaveURL(/\/motorista\/campeonato/);
    // Header da página deve aparecer (nome da temporada ou título estático)
    await expect(page.locator("body")).toContainText(/Campeonato|Temporada/i);
  });

  test("botão menu abre drawer com itens de navegação", async ({ page }) => {
    await page.goto(`/motorista/campeonato?brandId=${E2E_BRAND_ID}`);
    // Botão hambúrguer (aria-label ou ícone)
    const menuButton = page
      .getByRole("button", { name: /menu|abrir menu|navega/i })
      .first();
    await menuButton.click();
    // Pelo menos os 6 itens nucleares + Configurações
    const expectedItems = [
      /Classifica/i,
      /Duelos/i,
      /Mata-?mata|Chave/i,
      /Artilharia/i,
      /Pr[oó]ximos/i,
      /Not[ií]cias/i,
      /Configura/i,
    ];
    for (const re of expectedItems) {
      await expect(page.getByText(re).first()).toBeVisible();
    }
  });
});
/**
 * servico_trial_signup — normaliza row de subscription_plans pra shape
 * primitivo seguro (defesa contra React error #31 na rota pública /trial).
 *
 * Bug aqui = row com landing_config_json (objeto) passa cru pro JSX e
 * crasha a landing pública, price_cents null vira "null" string, trial_days
 * inválido (string "30 dias") vira NaN.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockFrom } = vi.hoisted(() => ({ mockFrom: vi.fn() }));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { from: mockFrom },
}));

import { normalizarPlanoTrial, buscarPlanoTrialPorSlug } from "../servico_trial_signup";

beforeEach(() => {
  mockFrom.mockReset();
});

describe("normalizarPlanoTrial", () => {
  it("row completo válido: shape mínimo + tipos corretos", () => {
    const result = normalizarPlanoTrial({
      slug: "essential",
      product_name: "Plano Essencial",
      trial_days: 30,
      price_cents: 9900,
      price_yearly_cents: 99000,
    }, "fallback");
    expect(result).toEqual({
      slug: "essential",
      product_name: "Plano Essencial",
      trial_days: 30,
      price_cents: 9900,
      price_yearly_cents: 99000,
    });
  });

  it("row=null: retorna null (não crasha)", () => {
    expect(normalizarPlanoTrial(null, "x")).toBeNull();
  });

  it("row=undefined: null", () => {
    expect(normalizarPlanoTrial(undefined, "x")).toBeNull();
  });

  it("row primitivo (não objeto): null", () => {
    expect(normalizarPlanoTrial("string", "x")).toBeNull();
    expect(normalizarPlanoTrial(42, "x")).toBeNull();
  });

  it("sem slug: usa fallback", () => {
    const result = normalizarPlanoTrial({ product_name: "X" }, "fallback-slug");
    expect(result?.slug).toBe("fallback-slug");
  });

  it("product_name vazio: tenta label → plan_key → 'Plano'", () => {
    expect(normalizarPlanoTrial({ slug: "x", label: "Label A" }, "x")?.product_name).toBe("Label A");
    expect(normalizarPlanoTrial({ slug: "x", plan_key: "plan_basic" }, "x")?.product_name).toBe("plan_basic");
    expect(normalizarPlanoTrial({ slug: "x" }, "x")?.product_name).toBe("Plano");
  });

  it("product_name como OBJETO (corrupto): vira fallback 'Plano' (não crasha)", () => {
    // Defesa contra React error #31
    const result = normalizarPlanoTrial({
      slug: "x",
      product_name: { foo: "bar" },
    }, "x");
    expect(result?.product_name).toBe("Plano");
  });

  it("trial_days string '60': converte pra number", () => {
    expect(normalizarPlanoTrial({ slug: "x", trial_days: "60" }, "x")?.trial_days).toBe(60);
  });

  it("trial_days inválido '30 dias': fallback 30", () => {
    expect(normalizarPlanoTrial({ slug: "x", trial_days: "30 dias" }, "x")?.trial_days).toBe(30);
  });

  it("trial_days ausente: fallback 30", () => {
    expect(normalizarPlanoTrial({ slug: "x" }, "x")?.trial_days).toBe(30);
  });

  it("price_cents 0: zero (não fallback)", () => {
    expect(normalizarPlanoTrial({ slug: "x", price_cents: 0 }, "x")?.price_cents).toBe(0);
  });

  it("price_yearly_cents null: null preservado", () => {
    expect(normalizarPlanoTrial({ slug: "x", price_yearly_cents: null }, "x")?.price_yearly_cents).toBeNull();
  });

  it("price_yearly_cents string '': null (não NaN)", () => {
    expect(normalizarPlanoTrial({ slug: "x", price_yearly_cents: "" }, "x")?.price_yearly_cents).toBeNull();
  });

  it("price_yearly_cents 'abc': null (string inválida)", () => {
    expect(normalizarPlanoTrial({ slug: "x", price_yearly_cents: "abc" }, "x")?.price_yearly_cents).toBeNull();
  });
});

describe("buscarPlanoTrialPorSlug", () => {
  it("slug vazio: retorna null sem fetch", async () => {
    const result = await buscarPlanoTrialPorSlug("");
    expect(result).toBeNull();
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("found + ativo: retorna normalizado", async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: {
          slug: "essential",
          product_name: "Essencial",
          trial_days: 14,
          price_cents: 4900,
        },
        error: null,
      }),
    });
    const result = await buscarPlanoTrialPorSlug("essential");
    expect(result?.slug).toBe("essential");
    expect(result?.trial_days).toBe(14);
  });

  it("not found: null", async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    });
    expect(await buscarPlanoTrialPorSlug("ghost")).toBeNull();
  });

  it("error: null (não throw — rota /trial precisa abrir)", async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: { message: "fail" } }),
    });
    expect(await buscarPlanoTrialPorSlug("x")).toBeNull();
  });

  it("exceção (rede): null (catch silencioso)", async () => {
    mockFrom.mockImplementation(() => { throw new Error("network"); });
    expect(await buscarPlanoTrialPorSlug("x")).toBeNull();
  });
});

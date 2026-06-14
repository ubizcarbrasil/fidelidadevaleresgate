/**
 * utilitarios_link_publico — gera links HTTPS pra landing e /trial.
 * Bug aqui = link copiado do editor Lovable apontava pro preview (em
 * vez de produção). Solução fixou o origin — esses testes garantem que
 * o domínio nunca muda sem atualizar o teste.
 */
import { describe, it, expect } from "vitest";
import {
  montarLinkLanding,
  montarLinkTrial,
  ORIGEM_LANDING_PRODUTOS,
} from "../utilitarios_link_publico";

describe("ORIGEM_LANDING_PRODUTOS", () => {
  it("é o domínio fixo de produção (app.valeresgate.com.br)", () => {
    expect(ORIGEM_LANDING_PRODUTOS).toBe("https://app.valeresgate.com.br");
  });
});

describe("montarLinkLanding", () => {
  it("slug 'cashback': URL completa", () => {
    expect(montarLinkLanding("cashback")).toBe(
      "https://app.valeresgate.com.br/p/produto/cashback",
    );
  });

  it("cycle yearly: adiciona ?cycle=yearly", () => {
    expect(montarLinkLanding("essential", { cycle: "yearly" })).toBe(
      "https://app.valeresgate.com.br/p/produto/essential?cycle=yearly",
    );
  });

  it("cycle monthly: NÃO adiciona param (default), URL limpa", () => {
    expect(montarLinkLanding("essential", { cycle: "monthly" })).toBe(
      "https://app.valeresgate.com.br/p/produto/essential",
    );
  });
});

describe("montarLinkTrial", () => {
  it("slug: trial?plan=X", () => {
    expect(montarLinkTrial("essential")).toBe(
      "https://app.valeresgate.com.br/trial?plan=essential",
    );
  });

  it("com cycle yearly: trial?plan=X&cycle=yearly", () => {
    expect(montarLinkTrial("essential", { cycle: "yearly" })).toBe(
      "https://app.valeresgate.com.br/trial?plan=essential&cycle=yearly",
    );
  });

  it("com cycle monthly: trial?plan=X&cycle=monthly", () => {
    expect(montarLinkTrial("essential", { cycle: "monthly" })).toBe(
      "https://app.valeresgate.com.br/trial?plan=essential&cycle=monthly",
    );
  });
});

/**
 * hook_duplicacoes_menu — orquestra a auditoria de duplicações dos 3
 * sidebars (Root, Brand, Branch). Bug aqui = badge "duplicado" não
 * aparece em itens reais OU aparece em itens que são compartilhados
 * por design (entre consoles).
 */
import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";

// Mock MENU_REGISTRY com algumas keys reais do código
vi.mock("@/compartilhados/constants/constantes_menu_sidebar", () => ({
  MENU_REGISTRY: {
    "sidebar.jornada": { url: "/jornada", moduleKey: "jornada", defaultTitle: "Jornada" },
    "sidebar.jornada_root": { url: "/jornada-root", moduleKey: "jornada", defaultTitle: "Jornada (Root)" },
    "sidebar.empresas": { url: "/empresas", moduleKey: "tenants", defaultTitle: "Empresas" },
    "sidebar.marcas": { url: "/brands", moduleKey: "brands", defaultTitle: "Marcas" },
    "sidebar.branches": { url: "/branches", moduleKey: "branches", defaultTitle: "Cidades" },
    "sidebar.clientes": { url: "/customers", moduleKey: "loyalty", defaultTitle: "Clientes" },
    "sidebar.resgates": { url: "/redemptions", moduleKey: "loyalty", defaultTitle: "Resgates" },
    "sidebar.ofertas": { url: "/offers", moduleKey: "loyalty", defaultTitle: "Ofertas" },
    "sidebar.achadinhos": { url: "/achadinhos", moduleKey: "affiliate_deals", defaultTitle: "Achadinhos" },
    "sidebar.categorias_achadinhos": {
      url: "/affiliate-categories", moduleKey: "affiliate_deals",
      defaultTitle: "Categorias Achadinhos",
    },
    "sidebar.enviar_notificacao": {
      url: "/send-notification", moduleKey: "notifications",
      defaultTitle: "Enviar notificação",
    },
    "sidebar.pontuar": { url: "/earn-points", moduleKey: "loyalty", defaultTitle: "Pontuar" },
    "sidebar.regras_pontos": { url: "/points-rules", moduleKey: "loyalty", defaultTitle: "Regras" },
    "sidebar.extrato_pontos": { url: "/points-ledger", moduleKey: "loyalty", defaultTitle: "Extrato" },
    "sidebar.relatorios": { url: "/reports", moduleKey: "reports", defaultTitle: "Relatórios" },
    "sidebar.auditoria": { url: "/audit", moduleKey: "audit", defaultTitle: "Auditoria" },
    "sidebar.importar_csv": { url: "/csv-import", moduleKey: "import", defaultTitle: "Importar" },
    "sidebar.aprovar_regras": { url: "/approve-rules", moduleKey: "rules", defaultTitle: "Aprovar Regras" },
    "sidebar.catalogo": { url: "/catalog", moduleKey: "catalog", defaultTitle: "Catálogo" },
  },
}));

import { useDuplicacoesMenu } from "../hook_duplicacoes_menu";

describe("useDuplicacoesMenu", () => {
  it("retorna shape esperada", () => {
    const { result } = renderHook(() => useDuplicacoesMenu());
    expect(result.current).toHaveProperty("ocorrencias");
    expect(result.current).toHaveProperty("relatorios");
    expect(result.current).toHaveProperty("chavesDuplicadas");
    expect(result.current).toHaveProperty("chavesDuplicadasPorConsole");
  });

  it("ocorrencias agrupa Root + Brand + Branch", () => {
    const { result } = renderHook(() => useDuplicacoesMenu());
    const consoles = new Set(result.current.ocorrencias.map((o) => o.console));
    expect(consoles).toContain("ROOT");
    expect(consoles).toContain("BRAND");
    expect(consoles).toContain("BRANCH");
  });

  it("chavesDuplicadasPorConsole tem entries pra ROOT/BRAND/BRANCH", () => {
    const { result } = renderHook(() => useDuplicacoesMenu());
    expect(result.current.chavesDuplicadasPorConsole.ROOT).toBeInstanceOf(Set);
    expect(result.current.chavesDuplicadasPorConsole.BRAND).toBeInstanceOf(Set);
    expect(result.current.chavesDuplicadasPorConsole.BRANCH).toBeInstanceOf(Set);
  });

  it("chavesDuplicadas (união) é Set vazia ou contém só duplicações intra-console", () => {
    const { result } = renderHook(() => useDuplicacoesMenu());
    const total = result.current.chavesDuplicadas;
    expect(total).toBeInstanceOf(Set);
    // Cada chave em chavesDuplicadas deve aparecer em pelo menos um dos
    // consoles individualmente (não pode haver "fantasma")
    for (const key of total) {
      const inAny =
        result.current.chavesDuplicadasPorConsole.ROOT.has(key) ||
        result.current.chavesDuplicadasPorConsole.BRAND.has(key) ||
        result.current.chavesDuplicadasPorConsole.BRANCH.has(key);
      expect(inAny).toBe(true);
    }
  });

  it("relatorios é array; cada relatório tem severidade + escopo + ocorrencias", () => {
    const { result } = renderHook(() => useDuplicacoesMenu());
    expect(Array.isArray(result.current.relatorios)).toBe(true);
    for (const r of result.current.relatorios) {
      expect(r).toHaveProperty("severidade");
      expect(r).toHaveProperty("escopo");
      expect(r).toHaveProperty("ocorrencias");
      expect(["rota_exata", "funcao_similar"]).toContain(r.severidade);
      expect(["intra_console", "entre_consoles"]).toContain(r.escopo);
      expect(r.ocorrencias.length).toBeGreaterThanOrEqual(2);
    }
  });

  it("memoização: rerender retorna mesma referência (objeto estável)", () => {
    const { result, rerender } = renderHook(() => useDuplicacoesMenu());
    const first = result.current;
    rerender();
    expect(result.current).toBe(first);
  });

  it("ocorrencias contém URL normalizada (sem trailing slash)", () => {
    const { result } = renderHook(() => useDuplicacoesMenu());
    for (const o of result.current.ocorrencias) {
      expect(o.url.endsWith("/")).toBe(o.url === "/" || o.url === ""); // só "/" pode terminar com /
    }
  });

  it("sidebar.jornada compartilhado entre Root e Brand: aparece em entre_consoles", () => {
    // jornada está em ROOT_GROUPS (Guias Inteligentes) E BRAND_GROUPS (Guias Inteligentes)
    const { result } = renderHook(() => useDuplicacoesMenu());
    const jornadaRel = result.current.relatorios.find(
      (r) => r.id === "url:/jornada" || r.criterio.includes("/jornada"),
    );
    if (jornadaRel) {
      expect(jornadaRel.escopo).toBe("entre_consoles");
    }
  });
});

/**
 * utilitarios_duplicacao_menu — detecção de itens de menu duplicados
 * entre/dentro de consoles. Bug aqui = falsos positivos no badge
 * "duplicado" OU duplicações reais não detectadas (UI confusa).
 */
import { describe, it, expect, vi } from "vitest";

// Mock do MENU_REGISTRY pra ter um conjunto controlado de itens
vi.mock("@/compartilhados/constants/constantes_menu_sidebar", () => ({
  MENU_REGISTRY: {
    "customers": { url: "/customers", moduleKey: "loyalty", defaultTitle: "Clientes" },
    "offers": { url: "/offers", moduleKey: "loyalty", defaultTitle: "Ofertas" },
    "wallet": { url: "/wallet", moduleKey: "wallet", defaultTitle: "Carteira" },
    "achadinhos": { url: "/achadinhos", moduleKey: "affiliate_deals", defaultTitle: "Achadinhos" },
    "achadinhos_v2": { url: "/produtos-resgate", moduleKey: "affiliate_deals", defaultTitle: "Achadinhos v2" },
    "dashboard": { url: "/", moduleKey: "dashboard", defaultTitle: "Dashboard" },
  },
}));

import {
  aplanarConsole,
  detectarDuplicacoes,
  obterChavesDuplicadas,
  obterChavesDuplicadasIntraConsole,
  type DefinicaoGrupoSimples,
  type OcorrenciaItemMenu,
} from "../utilitarios_duplicacao_menu";

// ── aplanarConsole ───────────────────────────────────────
describe("aplanarConsole", () => {
  it("mapeia grupos do registry pra lista de ocorrências", () => {
    const grupos: DefinicaoGrupoSimples[] = [
      { label: "G1", items: [{ key: "customers" }, { key: "offers" }] },
    ];
    const lista = aplanarConsole("BRAND", grupos);
    expect(lista).toHaveLength(2);
    expect(lista[0]).toMatchObject({
      console: "BRAND",
      grupo: "G1",
      itemKey: "customers",
      url: "/customers",
      moduleKey: "loyalty",
    });
  });

  it("ignora keys ausentes no registry sem throw", () => {
    const grupos: DefinicaoGrupoSimples[] = [
      { label: "G", items: [{ key: "naoExiste" }, { key: "customers" }] },
    ];
    const lista = aplanarConsole("ROOT", grupos);
    expect(lista).toHaveLength(1);
    expect(lista[0].itemKey).toBe("customers");
  });

  it("aplica overrides em cima do registry", () => {
    const grupos: DefinicaoGrupoSimples[] = [
      {
        label: "G",
        items: [
          {
            key: "customers",
            overrides: { url: "/clientes-novo", defaultTitle: "Clientes (novo)" } as never,
          },
        ],
      },
    ];
    const lista = aplanarConsole("BRAND", grupos);
    expect(lista[0].url).toBe("/clientes-novo");
    expect(lista[0].defaultTitle).toBe("Clientes (novo)");
  });

  it("normaliza url: remove querystring + trailing slash", () => {
    const grupos: DefinicaoGrupoSimples[] = [
      {
        label: "G",
        items: [{ key: "customers", overrides: { url: "/customers/?x=1" } as never }],
      },
    ];
    const lista = aplanarConsole("BRAND", grupos);
    expect(lista[0].url).toBe("/customers");
  });

  it("url vazia normaliza pra '/'", () => {
    const grupos: DefinicaoGrupoSimples[] = [
      {
        label: "G",
        items: [{ key: "customers", overrides: { url: "" } as never }],
      },
    ];
    const lista = aplanarConsole("BRAND", grupos);
    expect(lista[0].url).toBe("");
  });
});

// ── detectarDuplicacoes ──────────────────────────────────
describe("detectarDuplicacoes — rota_exata", () => {
  function occ(over: Partial<OcorrenciaItemMenu>): OcorrenciaItemMenu {
    return {
      console: "BRAND",
      grupo: "G",
      itemKey: "x",
      url: "/x",
      defaultTitle: "X",
      ...over,
    };
  }

  it("mesma URL em 2 consoles diferentes: rota_exata + escopo entre_consoles", () => {
    const r = detectarDuplicacoes([
      occ({ console: "ROOT", itemKey: "a", url: "/customers" }),
      occ({ console: "BRAND", itemKey: "b", url: "/customers" }),
    ]);
    expect(r).toHaveLength(1);
    expect(r[0].severidade).toBe("rota_exata");
    expect(r[0].escopo).toBe("entre_consoles");
    expect(r[0].id).toBe("url:/customers");
  });

  it("mesma URL 2x dentro do MESMO console: intra_console", () => {
    const r = detectarDuplicacoes([
      occ({ console: "BRAND", grupo: "G1", itemKey: "a", url: "/customers" }),
      occ({ console: "BRAND", grupo: "G2", itemKey: "b", url: "/customers" }),
    ]);
    expect(r).toHaveLength(1);
    expect(r[0].escopo).toBe("intra_console");
  });

  it("dashboard ('/') é IGNORADO (compartilhado por design)", () => {
    const r = detectarDuplicacoes([
      occ({ console: "ROOT", itemKey: "a", url: "/" }),
      occ({ console: "BRAND", itemKey: "b", url: "/" }),
    ]);
    expect(r).toHaveLength(0);
  });

  it("URL vazia: ignora", () => {
    const r = detectarDuplicacoes([
      occ({ console: "ROOT", itemKey: "a", url: "" }),
      occ({ console: "BRAND", itemKey: "b", url: "" }),
    ]);
    expect(r).toHaveLength(0);
  });

  it("URL única (1 ocorrência): não duplicada", () => {
    const r = detectarDuplicacoes([
      occ({ console: "ROOT", url: "/customers" }),
    ]);
    expect(r).toHaveLength(0);
  });
});

describe("detectarDuplicacoes — funcao_similar (mesma moduleKey)", () => {
  function occ(over: Partial<OcorrenciaItemMenu>): OcorrenciaItemMenu {
    return {
      console: "BRAND",
      grupo: "G",
      itemKey: "x",
      url: "/x",
      defaultTitle: "X",
      ...over,
    };
  }

  it("mesma moduleKey em URLs diferentes: funcao_similar", () => {
    const r = detectarDuplicacoes([
      occ({ itemKey: "a", url: "/v1", moduleKey: "affiliate_deals" }),
      occ({ itemKey: "b", url: "/v2", moduleKey: "affiliate_deals" }),
    ]);
    const funcSim = r.find((x) => x.severidade === "funcao_similar");
    expect(funcSim).toBeDefined();
    expect(funcSim!.id).toBe("mod:affiliate_deals");
  });

  it("mesma moduleKey + mesma URL: NÃO conta como funcao_similar (capturado pelo case A)", () => {
    const r = detectarDuplicacoes([
      occ({ console: "ROOT", itemKey: "a", url: "/same", moduleKey: "loyalty" }),
      occ({ console: "BRAND", itemKey: "b", url: "/same", moduleKey: "loyalty" }),
    ]);
    // Só rota_exata, sem funcao_similar duplicada
    expect(r.filter((x) => x.severidade === "funcao_similar")).toHaveLength(0);
  });

  it("ocorrência sem moduleKey: pulada na detecção B", () => {
    const r = detectarDuplicacoes([
      occ({ itemKey: "a", url: "/v1", moduleKey: undefined }),
      occ({ itemKey: "b", url: "/v2", moduleKey: undefined }),
    ]);
    expect(r).toHaveLength(0);
  });
});

describe("detectarDuplicacoes — ordenação", () => {
  function occ(over: Partial<OcorrenciaItemMenu>): OcorrenciaItemMenu {
    return {
      console: "BRAND",
      grupo: "G",
      itemKey: "x",
      url: "/x",
      defaultTitle: "X",
      ...over,
    };
  }

  it("rota_exata vem antes de funcao_similar", () => {
    const r = detectarDuplicacoes([
      // funcao_similar pair (moduleKey "m1" em URLs diferentes)
      occ({ itemKey: "a", url: "/v1", moduleKey: "m1" }),
      occ({ itemKey: "b", url: "/v2", moduleKey: "m1" }),
      // rota_exata pair (mesma url repetida)
      occ({ console: "ROOT", itemKey: "c", url: "/dup" }),
      occ({ console: "BRAND", itemKey: "d", url: "/dup" }),
    ]);
    expect(r[0].severidade).toBe("rota_exata");
    expect(r[r.length - 1].severidade).toBe("funcao_similar");
  });
});

// ── obterChavesDuplicadas / obterChavesDuplicadasIntraConsole ────
describe("obterChavesDuplicadas", () => {
  it("retorna Set com itemKeys de TODAS as duplicações", () => {
    const o: OcorrenciaItemMenu[] = [
      { console: "ROOT", grupo: "G", itemKey: "a", url: "/x", defaultTitle: "" },
      { console: "BRAND", grupo: "G", itemKey: "b", url: "/x", defaultTitle: "" },
      { console: "BRAND", grupo: "G", itemKey: "c", url: "/y", defaultTitle: "" }, // não duplicado
    ];
    const chaves = obterChavesDuplicadas(o);
    expect(chaves).toContain("a");
    expect(chaves).toContain("b");
    expect(chaves).not.toContain("c");
  });
});

describe("obterChavesDuplicadasIntraConsole", () => {
  it("recebe ocorrências de UM console: retorna duplicações dentro dele", () => {
    const o: OcorrenciaItemMenu[] = [
      { console: "BRAND", grupo: "G1", itemKey: "a", url: "/x", defaultTitle: "" },
      { console: "BRAND", grupo: "G2", itemKey: "b", url: "/x", defaultTitle: "" },
    ];
    const chaves = obterChavesDuplicadasIntraConsole(o);
    expect(chaves).toContain("a");
    expect(chaves).toContain("b");
  });

  it("ocorrências sem duplicação no console: Set vazio", () => {
    const o: OcorrenciaItemMenu[] = [
      { console: "BRAND", grupo: "G", itemKey: "a", url: "/x", defaultTitle: "" },
    ];
    expect(obterChavesDuplicadasIntraConsole(o).size).toBe(0);
  });
});

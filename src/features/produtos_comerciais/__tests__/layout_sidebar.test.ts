import { describe, it, expect } from "vitest";
import {
  mesclarLayout,
  snapshotComoOverride,
  moverGrupo,
  moverItem,
  construirGruposEfetivos,
} from "../utils/utilitarios_layout_sidebar";
import type { DefinicaoGrupoSidebar } from "@/compartilhados/constants/constantes_menu_sidebar";

/**
 * Usamos chaves reais do MENU_REGISTRY para que `buildSidebarGroups`
 * encontre os itens. Escolhemos chaves estáveis com módulos conhecidos.
 */
const defs: DefinicaoGrupoSidebar[] = [
  { label: "G1", items: ["sidebar.dashboard", "sidebar.manuais"] },
  { label: "G2", items: ["sidebar.branches", "sidebar.dominios"] },
  { label: "G3", items: ["sidebar.usuarios"] },
];

describe("utilitarios_layout_sidebar", () => {
  describe("mesclarLayout", () => {
    it("retorna defs originais quando não há override", () => {
      expect(mesclarLayout(defs, undefined)).toEqual(defs);
    });

    it("respeita ordem do override e adiciona grupos novos no fim", () => {
      const override = { grupos: [{ label: "G3", itens_keys: ["sidebar.usuarios"] }] };
      const out = mesclarLayout(defs, override);
      expect(out.map((g) => g.label)).toEqual(["G3", "G1", "G2"]);
    });

    it("respeita ordem dos itens do override e mantém itens novos no fim", () => {
      const override = {
        grupos: [
          { label: "G1", itens_keys: ["sidebar.manuais"] }, // pulou dashboard
          { label: "G2", itens_keys: ["sidebar.dominios", "sidebar.branches"] },
        ],
      };
      const out = mesclarLayout(defs, override);
      const g1Keys = out[0].items.map((e) => (typeof e === "string" ? e : e.key));
      expect(g1Keys).toEqual(["sidebar.manuais", "sidebar.dashboard"]);
      const g2Keys = out[1].items.map((e) => (typeof e === "string" ? e : e.key));
      expect(g2Keys).toEqual(["sidebar.dominios", "sidebar.branches"]);
    });

    it("descarta grupos do override que não existem mais no padrão", () => {
      const override = {
        grupos: [
          { label: "GX_obsoleto", itens_keys: ["foo"] },
          { label: "G1", itens_keys: ["sidebar.dashboard"] },
        ],
      };
      const out = mesclarLayout(defs, override);
      expect(out.map((g) => g.label)).toEqual(["G1", "G2", "G3"]);
    });
  });

  describe("moverGrupo", () => {
    it("move grupo para baixo", () => {
      const snap = snapshotComoOverride(defs, undefined);
      const out = moverGrupo(snap, 0, "down");
      expect(out.grupos.map((g) => g.label)).toEqual(["G2", "G1", "G3"]);
    });
    it("move grupo para cima", () => {
      const snap = snapshotComoOverride(defs, undefined);
      const out = moverGrupo(snap, 2, "up");
      expect(out.grupos.map((g) => g.label)).toEqual(["G1", "G3", "G2"]);
    });
    it("respeita bordas (não quebra ao mover além)", () => {
      const snap = snapshotComoOverride(defs, undefined);
      const out = moverGrupo(snap, 0, "up");
      expect(out.grupos.map((g) => g.label)).toEqual(["G1", "G2", "G3"]);
    });
  });

  describe("moverItem", () => {
    it("move item dentro do grupo", () => {
      const snap = snapshotComoOverride(defs, undefined);
      const out = moverItem(snap, 1, 0, "down"); // G2: branches <-> dominios
      expect(out.grupos[1].itens_keys).toEqual([
        "sidebar.dominios",
        "sidebar.branches",
      ]);
    });
    it("não quebra em borda", () => {
      const snap = snapshotComoOverride(defs, undefined);
      const out = moverItem(snap, 0, 0, "up");
      expect(out.grupos[0].itens_keys).toEqual([
        "sidebar.dashboard",
        "sidebar.manuais",
      ]);
    });
  });

  describe("construirGruposEfetivos", () => {
    it("marca itens como ativos com base no módulo selecionado ou is_core", () => {
      // sidebar.branches tem moduleKey "branches"; sidebar.dominios tem "domains".
      const modulos = [
        { id: "m1", key: "branches", is_core: false },
        { id: "m2", key: "domains", is_core: true },
        { id: "m3", key: "users_management", is_core: true },
        { id: "m4", key: "manuais", is_core: false },
      ];
      const efetivos = construirGruposEfetivos({
        defs,
        override: undefined,
        modulos,
        selectedIds: ["m1"], // só branches selecionado; domínios é core
        coreKeys: ["brand_settings", "subscription", "users_management"],
      });

      const g2 = efetivos.find((g) => g.label === "G2")!;
      const branches = g2.itens.find((i) => i.menuKey === "sidebar.branches")!;
      const dominios = g2.itens.find((i) => i.menuKey === "sidebar.dominios")!;
      expect(branches.moduleAtivo).toBe(true);
      expect(dominios.moduleAtivo).toBe(true); // is_core
      const g1 = efetivos.find((g) => g.label === "G1")!;
      const manuais = g1.itens.find((i) => i.menuKey === "sidebar.manuais")!;
      expect(manuais.moduleAtivo).toBe(false); // não core, não selecionado
    });

    it("itens sem moduleKey ficam sempre ativos (ex.: dashboard tem moduleKey, mas itens sem moduleKey também aparecem)", () => {
      // sidebar.empresas (não usado aqui) seria sem moduleKey; mas garantimos
      // o caminho via item sem moduleKey usando defs simples:
      const efetivos = construirGruposEfetivos({
        defs: [{ label: "X", items: ["sidebar.empresas"] }],
        override: undefined,
        modulos: [],
        selectedIds: [],
        coreKeys: [],
      });
      const item = efetivos[0].itens[0];
      expect(item.moduleAtivo).toBe(true);
      expect(item.moduleDefinitionId).toBeNull();
    });
  });
});
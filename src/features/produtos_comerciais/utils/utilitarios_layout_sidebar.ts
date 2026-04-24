import {
  buildSidebarGroups,
  type DefinicaoGrupoSidebar,
  type RegistroItemMenu,
} from "@/compartilhados/constants/constantes_menu_sidebar";
import type {
  SidebarLayoutOverride,
  SidebarLayoutGrupo,
} from "../types/tipos_produto";

export interface ItemEfetivo {
  menuKey: string;
  registro: RegistroItemMenu;
  /** true se o moduleKey do item está entre os módulos ativos do produto */
  moduleAtivo: boolean;
  /** moduleDefinitionId opcional para permitir desselecionar */
  moduleDefinitionId: string | null;
}

export interface GrupoEfetivo {
  label: string;
  itens: ItemEfetivo[];
}

/**
 * Mescla a ordem padrão (vinda do código) com o override salvo no produto.
 * Regras:
 *  - Se override existe, segue a ordem dos grupos do override.
 *  - Grupos novos no código (sem entrada no override) entram ao final.
 *  - Itens dentro de cada grupo seguem a ordem do override; itens novos
 *    no código (sem entrada) entram ao final do grupo.
 *  - Itens cujo `menuKey` não existe mais no registro central são descartados.
 */
export function mesclarLayout(
  defs: DefinicaoGrupoSidebar[],
  override: SidebarLayoutOverride | undefined,
): DefinicaoGrupoSidebar[] {
  if (!override?.grupos?.length) return defs;

  const padraoMap = new Map(defs.map((g) => [g.label, g]));
  const usados = new Set<string>();
  const resultado: DefinicaoGrupoSidebar[] = [];

  // 1. grupos do override, na ordem definida
  for (const grpOv of override.grupos) {
    const padrao = padraoMap.get(grpOv.label);
    if (!padrao) continue;
    usados.add(grpOv.label);

    const padraoItensKeys = padrao.items.map((entry) =>
      typeof entry === "string" ? entry : entry.key,
    );
    const padraoEntryByKey = new Map(
      padrao.items.map((entry) => [
        typeof entry === "string" ? entry : entry.key,
        entry,
      ]),
    );

    const itensOrdenados: typeof padrao.items = [];
    const adicionados = new Set<string>();

    // itens na ordem do override (apenas se ainda existem no padrão)
    for (const k of grpOv.itens_keys) {
      const entry = padraoEntryByKey.get(k);
      if (entry) {
        itensOrdenados.push(entry);
        adicionados.add(k);
      }
    }
    // itens novos do padrão entram no fim
    for (const k of padraoItensKeys) {
      if (!adicionados.has(k)) {
        const entry = padraoEntryByKey.get(k)!;
        itensOrdenados.push(entry);
      }
    }

    resultado.push({ ...padrao, items: itensOrdenados });
  }

  // 2. grupos novos do padrão entram ao final
  for (const def of defs) {
    if (!usados.has(def.label)) resultado.push(def);
  }

  return resultado;
}

/**
 * Calcula os grupos efetivos com flags de módulo ativo.
 */
export function construirGruposEfetivos(args: {
  defs: DefinicaoGrupoSidebar[];
  override: SidebarLayoutOverride | undefined;
  modulos: Array<{ id: string; key: string; is_core: boolean }>;
  selectedIds: string[];
  coreKeys: readonly string[];
}): GrupoEfetivo[] {
  const { defs, override, modulos, selectedIds, coreKeys } = args;

  const selectedSet = new Set(selectedIds);
  const keysAtivas = new Set<string>(coreKeys);
  const keyToId = new Map<string, string>();

  for (const m of modulos) {
    keyToId.set(m.key, m.id);
    if (m.is_core || selectedSet.has(m.id)) keysAtivas.add(m.key);
  }

  const defsMescladas = mesclarLayout(defs, override);
  const gruposBuild = buildSidebarGroups(defsMescladas);

  return gruposBuild.map((g) => ({
    label: g.label,
    itens: g.items.map<ItemEfetivo>((item) => {
      const moduleKey = item.moduleKey;
      let ativo = true;
      let moduleDefinitionId: string | null = null;
      if (moduleKey) {
        const keys = moduleKey.split("|").map((k) => k.trim());
        ativo = keys.some((k) => keysAtivas.has(k));
        // pega o id do primeiro módulo conhecido (para desativação)
        for (const k of keys) {
          const id = keyToId.get(k);
          if (id) {
            moduleDefinitionId = id;
            break;
          }
        }
      }
      return {
        menuKey: item.key,
        registro: item,
        moduleAtivo: ativo,
        moduleDefinitionId,
      };
    }),
  }));
}

/**
 * Reordenadores puros que produzem um novo SidebarLayoutOverride a partir
 * dos grupos efetivos atuais. Trabalham sempre sobre a "fotografia" atual
 * (defs mescladas com override anterior), de forma que mover um grupo novo
 * preserva também a ordem dos outros.
 */
export function snapshotComoOverride(
  defs: DefinicaoGrupoSidebar[],
  override: SidebarLayoutOverride | undefined,
): SidebarLayoutOverride {
  const mescladas = mesclarLayout(defs, override);
  return {
    grupos: mescladas.map<SidebarLayoutGrupo>((g) => ({
      label: g.label,
      itens_keys: g.items.map((entry) =>
        typeof entry === "string" ? entry : entry.key,
      ),
    })),
  };
}

function trocar<T>(arr: T[], i: number, j: number): T[] {
  if (i < 0 || j < 0 || i >= arr.length || j >= arr.length) return arr;
  const out = [...arr];
  [out[i], out[j]] = [out[j], out[i]];
  return out;
}

export function moverGrupo(
  layout: SidebarLayoutOverride,
  idx: number,
  direcao: "up" | "down",
): SidebarLayoutOverride {
  const target = direcao === "up" ? idx - 1 : idx + 1;
  return { grupos: trocar(layout.grupos, idx, target) };
}

export function moverItem(
  layout: SidebarLayoutOverride,
  grupoIdx: number,
  itemIdx: number,
  direcao: "up" | "down",
): SidebarLayoutOverride {
  const grupo = layout.grupos[grupoIdx];
  if (!grupo) return layout;
  const target = direcao === "up" ? itemIdx - 1 : itemIdx + 1;
  const novosItens = trocar(grupo.itens_keys, itemIdx, target);
  const novosGrupos = layout.grupos.map((g, i) =>
    i === grupoIdx ? { ...g, itens_keys: novosItens } : g,
  );
  return { grupos: novosGrupos };
}
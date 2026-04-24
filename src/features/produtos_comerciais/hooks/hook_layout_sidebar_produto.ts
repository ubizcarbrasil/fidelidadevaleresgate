import { useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { brandGroupDefs } from "@/compartilhados/constants/constantes_grupos_sidebar_marca";
import {
  construirGruposEfetivos,
  moverGrupo as moverGrupoPuro,
  moverItem as moverItemPuro,
  snapshotComoOverride,
  type GrupoEfetivo,
} from "../utils/utilitarios_layout_sidebar";
import type { ProdutoComercialDraft } from "../types/tipos_produto";

const CORE_KEYS = ["brand_settings", "subscription", "users_management"] as const;

interface ModuloDef {
  id: string;
  key: string;
  is_core: boolean;
}

interface UseLayoutSidebarProdutoArgs {
  draft: ProdutoComercialDraft;
  onChange: (patch: Partial<ProdutoComercialDraft>) => void;
}

export function useLayoutSidebarProduto({ draft, onChange }: UseLayoutSidebarProdutoArgs) {
  const { data: modulos, isLoading } = useQuery({
    queryKey: ["pc-layout-sidebar-modulos"],
    queryFn: async (): Promise<ModuloDef[]> => {
      const { data, error } = await supabase
        .from("module_definitions")
        .select("id, key, is_core");
      if (error) throw error;
      return (data ?? []) as ModuloDef[];
    },
    staleTime: 5 * 60_000,
  });

  const layoutAtual = draft.landing_config_json?.sidebar_layout;

  const gruposEfetivos: GrupoEfetivo[] = useMemo(() => {
    if (!modulos) return [];
    return construirGruposEfetivos({
      defs: brandGroupDefs,
      override: layoutAtual,
      modulos,
      selectedIds: draft.module_definition_ids,
      coreKeys: CORE_KEYS,
    });
  }, [modulos, layoutAtual, draft.module_definition_ids]);

  const aplicarLayout = useCallback(
    (novoLayout: ReturnType<typeof snapshotComoOverride>) => {
      onChange({
        landing_config_json: {
          ...draft.landing_config_json,
          sidebar_layout: novoLayout,
        },
      });
    },
    [onChange, draft.landing_config_json],
  );

  const baseSnapshot = useCallback(
    () => snapshotComoOverride(brandGroupDefs, layoutAtual),
    [layoutAtual],
  );

  const moverGrupo = useCallback(
    (idx: number, direcao: "up" | "down") => {
      aplicarLayout(moverGrupoPuro(baseSnapshot(), idx, direcao));
    },
    [aplicarLayout, baseSnapshot],
  );

  const moverItem = useCallback(
    (grupoIdx: number, itemIdx: number, direcao: "up" | "down") => {
      aplicarLayout(moverItemPuro(baseSnapshot(), grupoIdx, itemIdx, direcao));
    },
    [aplicarLayout, baseSnapshot],
  );

  const restaurarPadrao = useCallback(() => {
    const next = { ...draft.landing_config_json };
    delete next.sidebar_layout;
    onChange({ landing_config_json: next });
  }, [onChange, draft.landing_config_json]);

  /**
   * Remove um item do produto desselecionando o módulo correspondente.
   * Retorna o id do módulo removido (para feedback de toast/desfazer).
   */
  const removerItem = useCallback(
    (moduleDefinitionId: string | null): string | null => {
      if (!moduleDefinitionId) return null;
      if (!draft.module_definition_ids.includes(moduleDefinitionId)) return null;
      const novos = draft.module_definition_ids.filter((id) => id !== moduleDefinitionId);
      onChange({ module_definition_ids: novos });
      return moduleDefinitionId;
    },
    [onChange, draft.module_definition_ids],
  );

  /**
   * Remove todos os itens de um grupo (desseleciona todos os módulos
   * correspondentes que ainda estavam ativos).
   * Retorna a lista de ids removidos.
   */
  const removerGrupo = useCallback(
    (grupoLabel: string): string[] => {
      const grupo = gruposEfetivos.find((g) => g.label === grupoLabel);
      if (!grupo) return [];
      const idsParaRemover = grupo.itens
        .filter((it) => it.moduleAtivo && it.moduleDefinitionId)
        .map((it) => it.moduleDefinitionId!) // não-nulo garantido pelo filter
        .filter((id) => draft.module_definition_ids.includes(id));
      if (idsParaRemover.length === 0) return [];
      const novos = draft.module_definition_ids.filter((id) => !idsParaRemover.includes(id));
      onChange({ module_definition_ids: novos });
      return idsParaRemover;
    },
    [onChange, draft.module_definition_ids, gruposEfetivos],
  );

  const desfazerRemocao = useCallback(
    (ids: string[]) => {
      if (ids.length === 0) return;
      const merged = Array.from(new Set([...draft.module_definition_ids, ...ids]));
      onChange({ module_definition_ids: merged });
    },
    [onChange, draft.module_definition_ids],
  );

  return {
    isLoading,
    gruposEfetivos,
    temLayoutCustomizado: !!layoutAtual,
    moverGrupo,
    moverItem,
    removerItem,
    removerGrupo,
    desfazerRemocao,
    restaurarPadrao,
  };
}
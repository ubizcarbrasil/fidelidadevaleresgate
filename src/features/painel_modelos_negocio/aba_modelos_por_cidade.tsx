/**
 * AbaModelosPorCidade — Sub-fase 5.6
 * Aba "Modelos por Cidade" do painel do empreendedor.
 *
 * Pode ser renderizada em 2 contextos:
 *  - brand_admin (em /brand-modules) → mostra Select de cidades
 *  - branch_admin (em /branch-business-models) → recebe `lockedBranchId`
 *    e o Select fica oculto.
 *
 * Estado por modelo (composição em memória):
 *   inherited_on | inherited_off | override_off | override_on_orphan
 */
import { useMemo, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import SeletorCidadeOverrides from "./components/seletor_cidade_overrides";
import HeaderOverridesCidade from "./components/header_overrides_cidade";
import CardModeloCidade, {
  type CityModelCardData,
  type CityModelState,
} from "./components/card_modelo_cidade";
import { useBrandBusinessModels } from "@/compartilhados/hooks/hook_brand_business_models";
import { useCityBusinessModelOverrides } from "@/compartilhados/hooks/hook_city_business_model_overrides";
import type { BusinessModelDef } from "@/compartilhados/hooks/hook_brand_plan_business_models";

interface Props {
  brandId: string;
  /** Se informado, esconde o Select e fixa a cidade (usado por branch_admin). */
  lockedBranchId?: string;
}

const AUDIENCE_META: Record<
  "cliente" | "motorista" | "b2b",
  { emoji: string; label: string; description: string }
> = {
  cliente: {
    emoji: "🛍️",
    label: "Cliente",
    description: "Modelos voltados para clientes finais",
  },
  motorista: {
    emoji: "🚗",
    label: "Motorista",
    description: "Modelos voltados para motoristas parceiros",
  },
  b2b: {
    emoji: "🤝",
    label: "B2B",
    description: "Modelos de relacionamento entre marcas",
  },
};

const ORDER: Array<"cliente" | "motorista" | "b2b"> = [
  "cliente",
  "motorista",
  "b2b",
];

/**
 * Sprint 3 — Filtro UI-only.
 * Estes BMs foram consolidados em duelo_motorista.config_json.features.
 * Permanecem is_active=true no banco como rede de segurança (DS3-4).
 */
const HIDDEN_LEGACY_KEYS = new Set<string>([
  "cinturao_motorista",
  "aposta_motorista",
  "rank_motorista",
]);

function useAllBusinessModels() {
  return useQuery({
    queryKey: ["business-models-all"] as const,
    staleTime: 60_000,
    queryFn: async (): Promise<BusinessModelDef[]> => {
      const { data, error } = await supabase
        .from("business_models")
        .select(
          "id, key, name, description, audience, color, icon, pricing_model, sort_order"
        )
        .eq("is_active", true)
        .order("audience", { ascending: true })
        .order("sort_order", { ascending: true });
      if (error) throw error;
      const rows = (data ?? []) as unknown as BusinessModelDef[];
      return rows.filter((bm) => !HIDDEN_LEGACY_KEYS.has(bm.key));
    },
  });
}

function useBranchLabel(branchId: string | null) {
  return useQuery({
    queryKey: ["branch-label", branchId] as const,
    enabled: !!branchId,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("branches")
        .select("name")
        .eq("id", branchId!)
        .maybeSingle();
      if (error) throw error;
      return (data?.name as string) ?? "";
    },
  });
}

export default function AbaModelosPorCidade({ brandId, lockedBranchId }: Props) {
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(
    lockedBranchId ?? null
  );

  // Garante sincronização caso lockedBranchId mude depois (branch_admin login tardio)
  useEffect(() => {
    if (lockedBranchId && lockedBranchId !== selectedBranchId) {
      setSelectedBranchId(lockedBranchId);
    }
  }, [lockedBranchId, selectedBranchId]);

  const allModelsQ = useAllBusinessModels();
  const brandModelsQ = useBrandBusinessModels(brandId);
  const overridesQ = useCityBusinessModelOverrides(brandId, selectedBranchId);
  const branchLabelQ = useBranchLabel(selectedBranchId);

  const isLoading =
    allModelsQ.isLoading ||
    brandModelsQ.isLoading ||
    (!!selectedBranchId && overridesQ.isLoading);

  const { cards, counts, hasAnyOverride } = useMemo(() => {
    const all = allModelsQ.data ?? [];
    const brandRows = brandModelsQ.data ?? [];
    const overrides = overridesQ.data ?? [];

    const brandEnabledSet = new Set(
      brandRows.filter((r) => r.is_enabled).map((r) => r.business_model_id)
    );
    const overrideMap = new Map(
      overrides.map((o) => [o.business_model_id, o] as const)
    );

    const computed: CityModelCardData[] = all.map((def) => {
      const brandHasModel = brandEnabledSet.has(def.id);
      const ov = overrideMap.get(def.id) ?? null;

      let state: CityModelState;
      if (brandHasModel) {
        if (!ov) state = "inherited_on";
        else state = ov.is_enabled ? "inherited_on" : "override_off";
        // Caso patológico: brand ativou + override ON: tratamos como inherited_on
      } else {
        if (ov && ov.is_enabled) state = "override_on_orphan";
        else state = "inherited_off";
      }

      return { def, state, override: ov, brandHasModel };
    });

    let inheritedOn = 0;
    let overrideOff = 0;
    let inheritedOff = 0;
    computed.forEach((c) => {
      if (c.state === "inherited_on") inheritedOn += 1;
      else if (c.state === "override_off") overrideOff += 1;
      else if (c.state === "inherited_off") inheritedOff += 1;
    });

    return {
      cards: computed,
      counts: { inheritedOn, overrideOff, inheritedOff },
      hasAnyOverride: overrides.length > 0,
    };
  }, [allModelsQ.data, brandModelsQ.data, overridesQ.data]);

  const grouped = useMemo(() => {
    const out: Record<"cliente" | "motorista" | "b2b", CityModelCardData[]> = {
      cliente: [],
      motorista: [],
      b2b: [],
    };
    cards.forEach((c) => {
      out[c.def.audience].push(c);
    });
    return out;
  }, [cards]);

  return (
    <div className="space-y-6">
      {!lockedBranchId && (
        <SeletorCidadeOverrides
          brandId={brandId}
          selectedBranchId={selectedBranchId}
          onChange={setSelectedBranchId}
        />
      )}

      {!selectedBranchId && (
        <div className="rounded-xl bg-muted p-6 text-sm text-muted-foreground text-center">
          Selecione uma cidade para visualizar e configurar os modelos.
        </div>
      )}

      {selectedBranchId && isLoading && (
        <div className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-44 w-full" />
            ))}
          </div>
        </div>
      )}

      {selectedBranchId && !isLoading && (
        <>
          <HeaderOverridesCidade
            brandId={brandId}
            branchId={selectedBranchId}
            branchLabel={branchLabelQ.data ?? "Cidade selecionada"}
            inheritedOnCount={counts.inheritedOn}
            overrideOffCount={counts.overrideOff}
            inheritedOffCount={counts.inheritedOff}
            hasAnyOverride={hasAnyOverride}
          />

          <div className="space-y-6">
            {ORDER.map((aud) => {
              const list = grouped[aud];
              if (!list || list.length === 0) return null;
              const meta = AUDIENCE_META[aud];

              return (
                <section key={aud} className="space-y-3">
                  <header className="flex items-center gap-2">
                    <span className="text-lg">{meta.emoji}</span>
                    <div>
                      <h3 className="text-sm font-bold">
                        {meta.label.toUpperCase()} ({list.length})
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {meta.description}
                      </p>
                    </div>
                  </header>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {list.map((c) => (
                      <CardModeloCidade
                        key={c.def.id}
                        brandId={brandId}
                        branchId={selectedBranchId}
                        data={c}
                      />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

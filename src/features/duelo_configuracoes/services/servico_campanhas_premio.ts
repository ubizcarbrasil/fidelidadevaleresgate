import { supabase } from "@/integrations/supabase/client";
import type { CampanhaPremio } from "../types/tipos_configuracao_duelo";
import type { CampanhaPremioInput } from "../schemas/schema_campanha_premio";

export async function listarCampanhas(branchId: string): Promise<CampanhaPremio[]> {
  const { data, error } = await supabase
    .from("duel_prize_campaigns")
    .select("*")
    .eq("branch_id", branchId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as CampanhaPremio[];
}

export async function criarCampanha(params: CampanhaPremioInput & { brand_id: string; branch_id: string }) {
  const { data, error } = await supabase
    .from("duel_prize_campaigns")
    .insert({
      brand_id: params.brand_id,
      branch_id: params.branch_id,
      name: params.name,
      description: params.description || null,
      image_url: params.image_url || null,
      points_cost: params.points_cost,
      quantity_total: params.quantity_total,
      starts_at: params.starts_at,
      ends_at: params.ends_at,
      status: params.status,
    })
    .select()
    .single();
  if (error) throw error;
  return data as CampanhaPremio;
}

export async function atualizarCampanha(id: string, params: Partial<CampanhaPremioInput>) {
  const payload: Record<string, unknown> = { ...params };
  if ("description" in payload && !payload.description) payload.description = null;
  if ("image_url" in payload && !payload.image_url) payload.image_url = null;

  const { data, error } = await supabase
    .from("duel_prize_campaigns")
    .update(payload)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  if (!data) throw new Error("Campanha não atualizada (verifique permissões)");
  return data as CampanhaPremio;
}

export async function alterarStatusCampanha(id: string, status: "active" | "paused" | "ended") {
  return atualizarCampanha(id, { status } as any);
}
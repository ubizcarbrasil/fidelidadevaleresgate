import { supabase } from "@/integrations/supabase/client";

/**
 * Camada de acesso à flag por marca `brand_settings_json.duelo_campeonato_enabled`.
 *
 * Importante:
 * - Combina com a flag global `USE_DUELO_CAMPEONATO` no resolver
 *   `useDueloCampeonatoHabilitado` (City Flag Resolution: ausente = OFF).
 * - Aplica `.select()` no UPDATE por causa do Supabase Update Hardening
 *   (UPDATE sem .select() não retorna erro quando 0 linhas são afetadas).
 */

export interface ResultadoAtivacao {
  habilitado: boolean;
}

export async function buscarStatusAtivacao(
  brandId: string,
): Promise<ResultadoAtivacao> {
  const { data, error } = await supabase
    .from("brands")
    .select("brand_settings_json")
    .eq("id", brandId)
    .maybeSingle();
  if (error) throw error;
  const settings =
    (data?.brand_settings_json as Record<string, unknown> | null) ?? null;
  return { habilitado: settings?.duelo_campeonato_enabled === true };
}

export async function alterarStatusAtivacao(
  brandId: string,
  habilitado: boolean,
): Promise<ResultadoAtivacao> {
  // Lê settings atuais para preservar demais chaves (merge manual).
  const { data: atual, error: errLeitura } = await supabase
    .from("brands")
    .select("brand_settings_json")
    .eq("id", brandId)
    .maybeSingle();
  if (errLeitura) throw errLeitura;

  const settingsAtuais =
    (atual?.brand_settings_json as Record<string, unknown> | null) ?? {};
  const novosSettings = {
    ...settingsAtuais,
    duelo_campeonato_enabled: habilitado,
  };

  const { data, error } = await supabase
    .from("brands")
    .update({ brand_settings_json: novosSettings })
    .eq("id", brandId)
    .select("id, brand_settings_json")
    .maybeSingle();
  if (error) throw error;
  if (!data) {
    throw new Error(
      "Não foi possível atualizar a marca. Verifique suas permissões.",
    );
  }

  // Quando habilitado, garante a base completa: cria/atualiza o registro
  // em brand_business_models com Campeonato como formato ativo (default
  // sensato para novas marcas — evita que o seletor fique travado depois).
  if (habilitado) {
    try {
      const { data: modelo } = await supabase
        .from("business_models")
        .select("id")
        .eq("key", "duelo_motorista")
        .maybeSingle();

      if (modelo?.id) {
        await supabase.from("brand_business_models").upsert(
          {
            brand_id: brandId,
            business_model_id: modelo.id,
            is_enabled: true,
            engagement_format: "campeonato",
            allowed_engagement_formats: ["campeonato"],
            activated_at: new Date().toISOString(),
          },
          { onConflict: "brand_id,business_model_id" },
        );
      }
    } catch {
      // Best-effort: a flag principal já foi salva.
    }
  }

  // Best-effort audit trail (não bloqueia em caso de falha).
  try {
    const { data: userData } = await supabase.auth.getUser();
    await supabase.from("duelo_attempts_log").insert({
      brand_id: brandId,
      code: "brand_campeonato_toggled",
      message: habilitado ? "Campeonato ativado" : "Campeonato desativado",
      payload_json: { habilitado, actor_user_id: userData.user?.id ?? null },
    });
  } catch {
    // Auditoria é best-effort; nunca quebra o fluxo principal.
  }

  const settings =
    (data.brand_settings_json as Record<string, unknown> | null) ?? null;
  return { habilitado: settings?.duelo_campeonato_enabled === true };
}
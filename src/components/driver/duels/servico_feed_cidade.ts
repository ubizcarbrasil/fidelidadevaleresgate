/**
 * Serviço stub para o feed competitivo da cidade.
 * Insere eventos na tabela city_feed_events para exibição futura.
 */
import { supabase } from "@/integrations/supabase/client";

interface ParamsFeedEvento {
  branchId: string;
  brandId: string;
  eventType: string;
  customerId?: string | null;
  title: string;
  description?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Registra um evento no feed competitivo da cidade.
 * Falhas são silenciosas — o feed é complementar, não crítico.
 */
export async function registrarEventoFeed({
  branchId,
  brandId,
  eventType,
  customerId,
  title,
  description,
  metadata,
}: ParamsFeedEvento): Promise<void> {
  try {
    await supabase.from("city_feed_events").insert([{
      branch_id: branchId,
      brand_id: brandId,
      event_type: eventType,
      customer_id: customerId ?? null,
      title,
      description: description ?? null,
      metadata_json: metadata ?? {},
    }]);
  } catch (err) {
    console.error("[FeedCidade] Falha ao registrar evento:", err);
  }
}

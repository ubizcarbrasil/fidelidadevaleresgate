import { supabase } from "@/integrations/supabase/client";
import { ImportacaoUploadError } from "../types/tipos_importacao";
import type { LinhaMapeada } from "../types/tipos_importacao";

/**
 * Sobe o JSON com as linhas mapeadas para o bucket privado `importacoes-motoristas`.
 *
 * Por que via Storage e não via `functions.invoke()` direto:
 * - No iPhone PWA, payloads grandes (>1MB) com 2k–5k linhas frequentemente
 *   morrem no `invoke()` (Safari fecha conexão silenciosamente em ~30s).
 * - O upload pro Storage usa `fetch` chunked nativo e funciona até em rede móvel.
 * - Depois passamos só o `storage_path` (curto) para a edge function.
 */
export async function uploadPlanilhaParaStorage(linhas: LinhaMapeada[]): Promise<string> {
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user.id;
  if (!userId) throw new ImportacaoUploadError("Sessão expirada — faça login novamente.");

  const conteudo = JSON.stringify({ rows: linhas });
  const blob = new Blob([conteudo], { type: "application/json" });

  // Pasta = userId (RLS exige). Nome único com timestamp + random.
  const nomeArquivo = `linhas-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.json`;
  const path = `${userId}/${nomeArquivo}`;

  const { error } = await supabase.storage
    .from("importacoes-motoristas")
    .upload(path, blob, {
      cacheControl: "0",
      contentType: "application/json",
      upsert: false,
    });

  if (error) {
    throw new ImportacaoUploadError(`Não foi possível enviar a planilha: ${error.message}`);
  }

  return path;
}
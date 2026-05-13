import { supabase } from "@/integrations/supabase/client";

export interface ResultadoUploadFoto {
  sucesso: boolean;
  mensagemErro?: string;
}

/**
 * Encapsula o upload de foto de perfil do motorista via edge function
 * `driver-upload-photo`. Mantém o mesmo mapeamento de erros usado pelo
 * `BloqueioInscricaoSemFoto` para garantir consistência de mensagens
 * em pt-BR.
 */
export async function uploadFotoMotorista(params: {
  driverId: string;
  file: File;
}): Promise<ResultadoUploadFoto> {
  const { driverId, file } = params;

  if (!driverId) {
    return { sucesso: false, mensagemErro: "Sessão inválida. Faça login novamente." };
  }
  if (!file) {
    return { sucesso: false, mensagemErro: "Arquivo inválido." };
  }

  try {
    const formData = new FormData();
    formData.append("driver_id", driverId);
    formData.append("file", file);

    const { data, error } = await supabase.functions.invoke(
      "driver-upload-photo",
      { body: formData },
    );

    if (error || (data as any)?.error) {
      const code = (data as any)?.error ?? "";
      const msg = (data as any)?.message ?? "";
      if (code === "bucket_missing") {
        return {
          sucesso: false,
          mensagemErro:
            "O armazenamento de fotos ainda não foi configurado. Avise o suporte do app.",
        };
      }
      if (code === "invalid_file") {
        return { sucesso: false, mensagemErro: msg || "Arquivo inválido." };
      }
      if (code === "driver_not_found" || code === "not_a_driver") {
        return {
          sucesso: false,
          mensagemErro: "Sua sessão expirou. Faça login novamente.",
        };
      }
      return {
        sucesso: false,
        mensagemErro: "Não foi possível enviar a foto. Tente novamente.",
      };
    }

    return { sucesso: true };
  } catch {
    return {
      sucesso: false,
      mensagemErro: "Erro inesperado ao enviar a foto. Tente novamente.",
    };
  }
}
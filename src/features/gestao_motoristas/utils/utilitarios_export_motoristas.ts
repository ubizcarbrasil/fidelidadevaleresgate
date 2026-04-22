import type { DriverRow } from "@/types/driver";
import { supabase } from "@/integrations/supabase/client";

const limparNome = (nome: string | null) =>
  nome?.replace(/\[MOTORISTA\]\s*/i, "").trim() || "Sem nome";

const formatarCpf = (cpf: string | null) => {
  if (!cpf) return "";
  const digits = cpf.replace(/\D/g, "").padStart(11, "0");
  if (digits.length === 11) {
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
  }
  return cpf;
};

const escaparCampo = (valor: string | number | null | undefined): string => {
  const str = valor == null ? "" : String(valor);
  return `"${str.replace(/"/g, '""')}"`;
};

/**
 * Gera um Blob CSV (UTF-8 com BOM) com a lista completa de motoristas.
 */
export function gerarCsvMotoristas(motoristas: DriverRow[]): Blob {
  const cabecalho = [
    "Nome",
    "CPF",
    "Telefone",
    "Email",
    "Cidade",
    "Saldo Pontos",
    "Pontos Corridas",
    "Total Corridas",
    "Tier",
    "Pontuação Ativa",
  ]
    .map(escaparCampo)
    .join(",");

  const linhas = motoristas.map((c) =>
    [
      escaparCampo(limparNome(c.name)),
      escaparCampo(formatarCpf(c.cpf)),
      escaparCampo(c.phone || ""),
      escaparCampo(c.email || ""),
      escaparCampo(c.branch_name || ""),
      escaparCampo(c.points_balance),
      escaparCampo(c.total_ride_points),
      escaparCampo(c.total_rides),
      escaparCampo(c.customer_tier || ""),
      escaparCampo(c.scoring_disabled ? "Não" : "Sim"),
    ].join(","),
  );

  const csv = [cabecalho, ...linhas].join("\r\n");
  return new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
}

// ============================================================================
// Detecção de plataforma
// ============================================================================

export const ehStandalonePWA = (): boolean => {
  if (typeof window === "undefined") return false;
  const matchStandalone = window.matchMedia?.("(display-mode: standalone)").matches ?? false;
  const iosStandalone = (window.navigator as any)?.standalone === true;
  return matchStandalone || iosStandalone;
};

export const ehIOS = (): boolean => {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  return (
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === "MacIntel" && (navigator as any).maxTouchPoints > 1)
  );
};

/**
 * Plataformas onde `blob:` URLs e `<a download>` falham (tela branca / nada acontece).
 * Nesses casos, precisamos sempre entregar uma URL HTTPS real.
 */
export const exigeUrlHttps = (): boolean => ehIOS() || ehStandalonePWA();

// ============================================================================
// Upload do CSV para Storage e geração de URL assinada
// ============================================================================

export const BUCKET_EXPORTACOES = "exportacoes-motoristas";
const TTL_URL_ASSINADA_SEGUNDOS = 60 * 30; // 30 minutos

export interface ResultadoUploadExport {
  url: string;
  caminhoStorage: string;
  expiraEm: Date;
}

/**
 * Faz upload do CSV para o Supabase Storage (bucket privado) e retorna URL HTTPS assinada.
 * O caminho é prefixado pelo `auth.uid()` para isolamento por usuário (RLS).
 */
export async function uploadCsvParaStorage(
  blob: Blob,
  nomeArquivo: string,
): Promise<ResultadoUploadExport> {
  const { data: sessao, error: erroSessao } = await supabase.auth.getUser();
  if (erroSessao || !sessao?.user?.id) {
    throw new Error("Sessão expirada. Faça login novamente para exportar.");
  }
  const userId = sessao.user.id;
  const timestamp = Date.now();
  const caminhoStorage = `${userId}/${timestamp}-${nomeArquivo}`;

  const { error: erroUpload } = await supabase.storage
    .from(BUCKET_EXPORTACOES)
    .upload(caminhoStorage, blob, {
      contentType: "text/csv;charset=utf-8;",
      upsert: true,
      cacheControl: "60",
    });

  if (erroUpload) {
    throw new Error(`Falha ao enviar CSV para o servidor: ${erroUpload.message}`);
  }

  const { data: dadosUrl, error: erroUrl } = await supabase.storage
    .from(BUCKET_EXPORTACOES)
    .createSignedUrl(caminhoStorage, TTL_URL_ASSINADA_SEGUNDOS, {
      download: nomeArquivo,
    });

  if (erroUrl || !dadosUrl?.signedUrl) {
    throw new Error("Não foi possível gerar a URL de download.");
  }

  return {
    url: dadosUrl.signedUrl,
    caminhoStorage,
    expiraEm: new Date(Date.now() + TTL_URL_ASSINADA_SEGUNDOS * 1000),
  };
}

// ============================================================================
// Abertura do CSV (entrega real ao usuário)
// ============================================================================

export type ModoEntrega = "url-https" | "download-direto";

/**
 * Abre o CSV para o usuário a partir de uma URL HTTPS real.
 *
 * - **iOS / PWA standalone**: `window.location.assign(url)` — substitui a aba/janela
 *   pela URL real, sem `blob:` e sem tela branca. O Safari oferece "Abrir em..." /
 *   "Baixar arquivo" nativamente.
 * - **Desktop / Android**: cria `<a href download>` e dispara click — download direto.
 */
export async function abrirCsvPorUrl(url: string, nomeArquivo: string): Promise<ModoEntrega> {
  if (exigeUrlHttps()) {
    window.location.assign(url);
    return "url-https";
  }

  try {
    const a = document.createElement("a");
    a.href = url;
    a.download = nomeArquivo;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    return "download-direto";
  } catch {
    window.open(url, "_blank", "noopener");
    return "url-https";
  }
}
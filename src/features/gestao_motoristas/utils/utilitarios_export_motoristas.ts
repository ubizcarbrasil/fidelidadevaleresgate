import type { DriverRow } from "@/types/driver";

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
  // Sempre envolve em aspas e escapa aspas internas (mais seguro p/ Excel)
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

/**
 * Dispara download do CSV no navegador.
 * Estratégia em cascata para máxima compatibilidade:
 *   1. Web Share API (mobile / iOS PWA / Android) — abre share sheet nativo.
 *   2. <a download> clássico — desktop.
 *   3. window.open(blobUrl) — fallback final.
 *
 * Retorna o "modo" usado para o caller ajustar a mensagem de feedback.
 */
export type ModoDownload = "share" | "download" | "nova-aba";

const ehStandalonePWA = (): boolean => {
  if (typeof window === "undefined") return false;
  const matchStandalone = window.matchMedia?.("(display-mode: standalone)").matches ?? false;
  const iosStandalone = (window.navigator as any).standalone === true;
  return matchStandalone || iosStandalone;
};

export async function baixarCsvMotoristas(
  blob: Blob,
  nomeArquivo: string,
): Promise<ModoDownload> {
  // Estratégia 1: Web Share API com arquivo (preferida em mobile/PWA)
  try {
    const file = new File([blob], nomeArquivo, { type: "text/csv" });
    const navAny = navigator as any;
    const podeCompartilharArquivo =
      typeof navAny.share === "function" &&
      typeof navAny.canShare === "function" &&
      navAny.canShare({ files: [file] });

    if (podeCompartilharArquivo) {
      await navAny.share({
        files: [file],
        title: nomeArquivo,
      });
      return "share";
    }
  } catch (err: any) {
    // AbortError = usuário cancelou o sheet → propaga para o hook tratar.
    if (err?.name === "AbortError") throw err;
    // Outros erros: cai para próxima estratégia.
  }

  // Em PWA standalone iOS, <a download> não funciona — pula direto para nova aba.
  const url = URL.createObjectURL(blob);

  if (!ehStandalonePWA()) {
    // Estratégia 2: <a download> clássico (desktop e Android Chrome fora do PWA)
    try {
      const a = document.createElement("a");
      a.href = url;
      a.download = nomeArquivo;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      return "download";
    } catch {
      // cai para fallback
    }
  }

  // Estratégia 3: abrir em nova aba para o usuário salvar manualmente
  window.open(url, "_blank");
  setTimeout(() => URL.revokeObjectURL(url), 5000);
  return "nova-aba";
}
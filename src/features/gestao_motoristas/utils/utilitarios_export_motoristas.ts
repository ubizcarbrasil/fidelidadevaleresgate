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
 */
export function baixarCsvMotoristas(blob: Blob, nomeArquivo: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nomeArquivo;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
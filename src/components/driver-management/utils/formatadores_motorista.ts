/**
 * Formatadores reutilizáveis na ficha do motorista.
 */

export const VAZIO = "—";

export function formatarTexto(valor: string | null | undefined): string {
  if (!valor || !String(valor).trim()) return VAZIO;
  return String(valor).trim();
}

export function formatarNumero(valor: number | null | undefined): string {
  if (valor === null || valor === undefined) return VAZIO;
  return String(valor);
}

export function formatarBooleano(valor: boolean | null | undefined): string {
  if (valor === null || valor === undefined) return VAZIO;
  return valor ? "Sim" : "Não";
}

export function formatarCpf(cpf: string | null): string {
  if (!cpf) return VAZIO;
  const digits = cpf.replace(/\D/g, "").padStart(11, "0");
  if (digits.length === 11) {
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
  }
  return cpf;
}

export function formatarData(data: string | null | undefined): string {
  if (!data) return VAZIO;
  try {
    const d = new Date(data);
    if (isNaN(d.getTime())) return VAZIO;
    return d.toLocaleDateString("pt-BR");
  } catch {
    return VAZIO;
  }
}

export function formatarDataHora(data: string | null | undefined): string {
  if (!data) return VAZIO;
  try {
    const d = new Date(data);
    if (isNaN(d.getTime())) return VAZIO;
    return d.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return VAZIO;
  }
}

export function formatarPlaca(placa: string | null | undefined): string {
  if (!placa) return VAZIO;
  return placa.toUpperCase().replace(/\s/g, "");
}

export function cnhVencida(expiracao: string | null | undefined): boolean {
  if (!expiracao) return false;
  try {
    const d = new Date(expiracao);
    if (isNaN(d.getTime())) return false;
    return d < new Date();
  } catch {
    return false;
  }
}

export function limparNomeMotorista(name: string | null): string {
  return name?.replace(/\[MOTORISTA\]\s*/i, "").trim() || "Sem nome";
}

/**
 * Traduz chaves técnicas do JSONB de pagamentos/serviços para rótulos amigáveis.
 */
const ROTULOS_PAGAMENTOS: Record<string, string> = {
  credito: "Crédito",
  debito: "Débito",
  voucher: "Voucher",
  ticket: "Ticket",
  cartao_app: "Cartão pelo App",
  wappa: "Wappa",
  pix: "PIX",
  picpay: "PicPay",
  whatsapp: "WhatsApp",
  faturado: "Faturado",
  carteira_creditos: "Carteira de Créditos",
};

const ROTULOS_SERVICOS: Record<string, string> = {
  animais: "Animais",
  corrida_central: "Corrida Central",
  macaneta: "Maçaneta",
  ubiz_whatsapp: "Ubiz WhatsApp",
  ubiz_frete: "Ubiz Frete",
  ubiz_guincho: "Ubiz Guincho",
  ubiz_x: "Ubiz X",
  ubiz_x_identificado: "Ubiz X Identificado",
};

export function rotuloPagamento(chave: string): string {
  return ROTULOS_PAGAMENTOS[chave] ?? chave;
}

export function rotuloServico(chave: string): string {
  return ROTULOS_SERVICOS[chave] ?? chave;
}

export function listarFlagsAtivas(
  obj: Record<string, boolean> | null | undefined,
  rotulador: (k: string) => string,
): string[] {
  if (!obj) return [];
  return Object.entries(obj)
    .filter(([, v]) => v === true)
    .map(([k]) => rotulador(k));
}

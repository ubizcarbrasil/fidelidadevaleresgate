import type { LinhaMapeada, LinhaPlanilha, ResumoMapeamento } from "../types/tipos_importacao";

/** Normaliza header: lowercase, sem acento, sem espaço. */
export function normalizarChave(s: string): string {
  return s
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

/** Tenta parsear data dos formatos brasileiros mais comuns. Retorna ISO yyyy-mm-dd ou undefined. */
function parseDataBR(v: string | undefined): string | undefined {
  if (!v) return undefined;
  const s = v.trim();
  if (!s) return undefined;
  // 12/03/1985 ou 12-03-1985
  const m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (m) {
    let [, d, mo, y] = m;
    if (y.length === 2) y = "20" + y;
    return `${y.padStart(4, "0")}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  // ISO já
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  return undefined;
}

function parseDataHora(v: string | undefined): string | undefined {
  if (!v) return undefined;
  const s = v.trim();
  if (!s) return undefined;
  const m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (m) {
    let [, d, mo, y, h, mi, se] = m;
    if (y.length === 2) y = "20" + y;
    return `${y.padStart(4, "0")}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}T${h.padStart(2, "0")}:${mi}:${(se || "00").padStart(2, "0")}`;
  }
  return parseDataBR(s);
}

function parseBool(v: string | undefined): boolean | undefined {
  if (v === undefined || v === null) return undefined;
  const s = v.toString().trim().toLowerCase();
  if (!s) return undefined;
  if (["sim", "s", "true", "1", "yes", "y"].includes(s)) return true;
  if (["nao", "n", "false", "0", "no"].includes(s)) return false;
  return undefined;
}

function parseInt2(v: string | undefined): number | undefined {
  if (!v) return undefined;
  const n = parseInt(v.toString().replace(/\D/g, ""), 10);
  return Number.isFinite(n) ? n : undefined;
}

function parseFloat2(v: string | undefined): number | undefined {
  if (!v) return undefined;
  const cleaned = v.toString().replace(/\./g, "").replace(",", ".").replace(/[^0-9.\-]/g, "");
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : undefined;
}

function trimOrUndef(v: string | undefined): string | undefined {
  if (!v) return undefined;
  const s = v.toString().trim();
  return s ? s : undefined;
}

/** Mapeia chaves normalizadas do TaxiMachine para o esquema interno. */
const MAPA: Record<string, keyof LinhaMapeada> = {
  // Identificação
  id: "external_id",
  motorista_id: "external_id",
  nome: "name",
  name: "name",
  cpf: "cpf",
  cpf_cnpj: "cpf",
  telefone: "phone",
  celular: "phone",
  fone: "phone",
  email: "email",
  e_mail: "email",
  sexo: "gender",
  genero: "gender",
  data_nascimento: "birth_date",
  nascimento: "birth_date",
  nome_da_mae: "mother_name",
  mae: "mother_name",
  // CNH
  cnh: "cnh_number",
  numero_cnh: "cnh_number",
  validade_cnh: "cnh_expiration",
  vencimento_cnh: "cnh_expiration",
  // Avaliação
  avaliacao: "rating",
  rating: "rating",
  taxa_aceitacao: "acceptance_rate",
  aceitacao: "acceptance_rate",
  // Status
  status_cadastral: "registration_status",
  status: "registration_status",
  cadastrado_em: "registered_at",
  data_cadastro: "registered_at",
  bloqueado_ate: "blocked_until",
  motivo_bloqueio: "block_reason",
  ultima_os: "last_os_at",
  ultima_atividade: "last_activity_at",
  // Vínculo
  tipo_vinculo: "link_type",
  vinculo: "link_type",
  funcao: "relationship",
  relacionamento: "relationship",
  // Veículo 1
  veiculo: "vehicle1_model",
  modelo: "vehicle1_model",
  modelo_veiculo: "vehicle1_model",
  ano: "vehicle1_year",
  ano_veiculo: "vehicle1_year",
  cor: "vehicle1_color",
  cor_veiculo: "vehicle1_color",
  placa: "vehicle1_plate",
  uf: "vehicle1_state",
  cidade_emplacamento: "vehicle1_city",
  renavam: "vehicle1_renavam",
  proprio: "vehicle1_own",
  ano_exercicio: "vehicle1_exercise_year",
  // Veículo 2
  veiculo_2: "vehicle2_model",
  modelo_2: "vehicle2_model",
  ano_2: "vehicle2_year",
  cor_2: "vehicle2_color",
  placa_2: "vehicle2_plate",
  uf_2: "vehicle2_state",
  cidade_emplacamento_2: "vehicle2_city",
  renavam_2: "vehicle2_renavam",
  proprio_2: "vehicle2_own",
  ano_exercicio_2: "vehicle2_exercise_year",
  // Endereço
  endereco: "address_street",
  rua: "address_street",
  logradouro: "address_street",
  numero: "address_number",
  complemento: "address_complement",
  bairro: "address_neighborhood",
  cidade: "address_city",
  estado: "address_state",
  cep: "address_zipcode",
  // Bancário
  banco: "bank_code",
  codigo_banco: "bank_code",
  agencia: "bank_agency",
  conta: "bank_account",
  conta_bancaria: "bank_account",
  cpf_titular: "bank_holder_cpf",
  titular: "bank_holder_name",
  nome_titular: "bank_holder_name",
  pix: "pix_key",
  chave_pix: "pix_key",
  // Observações
  observacoes: "extra_data",
  obs: "extra_data",
  obs_1: "internal_note_1",
  obs_2: "internal_note_2",
  obs_3: "internal_note_3",
  observacao_interna_1: "internal_note_1",
  observacao_interna_2: "internal_note_2",
  observacao_interna_3: "internal_note_3",
  // Equipamento
  imei: "imei_1",
  imei_1: "imei_1",
  imei_2: "imei_2",
  vtr: "vtr",
  versao_app: "app_version",
  app: "app_version",
  // Indicação
  indicado_por: "referred_by",
};

/** Heurísticas para flags de pagamento e serviços */
const FLAGS_PAGAMENTO = [
  "credito",
  "debito",
  "voucher",
  "ticket",
  "cartao_app",
  "wappa",
  "pix",
  "picpay",
  "whatsapp",
  "faturado",
  "carteira_creditos",
];
const FLAGS_SERVICO = [
  "animais",
  "corrida_central",
  "macaneta",
  "ubiz_whatsapp",
  "ubiz_frete",
  "ubiz_guincho",
  "ubiz_x",
  "ubiz_x_identificado",
];
const PREFIXOS_TAXA = ["taxa_", "faixa_", "macaneta_", "conveniencia_", "seguro_"];

export function mapearLinha(rawIn: LinhaPlanilha): LinhaMapeada {
  const raw: LinhaPlanilha = {};
  // Re-normaliza chaves
  Object.entries(rawIn).forEach(([k, v]) => {
    raw[normalizarChave(k)] = v as string;
  });

  const out: LinhaMapeada = { raw };
  const accepted: Record<string, boolean> = {};
  const services: Record<string, boolean> = {};
  const fees: Record<string, string | number> = {};

  for (const [chaveNorm, valor] of Object.entries(raw)) {
    if (!valor) continue;
    const v = valor.toString().trim();
    if (!v) continue;

    // Flags pagamento
    const flagPag = FLAGS_PAGAMENTO.find((f) => chaveNorm === f || chaveNorm.endsWith("_" + f));
    if (flagPag) {
      const b = parseBool(v);
      if (b !== undefined) accepted[flagPag] = b;
      continue;
    }
    // Flags serviço
    const flagServ = FLAGS_SERVICO.find((f) => chaveNorm === f || chaveNorm.endsWith("_" + f));
    if (flagServ) {
      const b = parseBool(v);
      if (b !== undefined) services[flagServ] = b;
      continue;
    }
    // Taxas
    if (PREFIXOS_TAXA.some((p) => chaveNorm.startsWith(p))) {
      const num = parseFloat2(v);
      fees[chaveNorm] = num !== undefined ? num : v;
      continue;
    }

    // Mapa direto
    const destino = MAPA[chaveNorm];
    if (!destino) continue;

    switch (destino) {
      case "birth_date":
      case "cnh_expiration":
        out[destino] = parseDataBR(v) as never;
        break;
      case "registered_at":
      case "blocked_until":
      case "last_os_at":
      case "last_activity_at":
        (out[destino] as string | undefined) = parseDataHora(v);
        break;
      case "rating":
        out.rating = parseFloat2(v);
        break;
      case "acceptance_rate":
        out.acceptance_rate = parseInt2(v);
        break;
      case "vehicle1_year":
      case "vehicle1_exercise_year":
      case "vehicle2_year":
      case "vehicle2_exercise_year":
        (out[destino] as number | undefined) = parseInt2(v);
        break;
      case "vehicle1_own":
      case "vehicle2_own":
      case "has_ear":
        (out[destino] as boolean | undefined) = parseBool(v);
        break;
      default:
        (out[destino] as string | undefined) = trimOrUndef(v);
    }
  }

  // Heurística EAR a partir do campo "cnh" tipo "12345 EAR"
  if (typeof raw["cnh_sem_ear"] === "string") {
    out.has_ear = /ear/i.test(raw["cnh_sem_ear"]);
  } else if (out.cnh_number && /ear/i.test(out.cnh_number)) {
    out.has_ear = true;
  }

  if (Object.keys(accepted).length) out.accepted_payments = accepted;
  if (Object.keys(services).length) out.services_offered = services;
  if (Object.keys(fees).length) out.fees_json = fees;

  return out;
}

export function calcularResumoMapeamento(linha: LinhaPlanilha): ResumoMapeamento {
  const chaves = Object.keys(linha).map(normalizarChave);
  const reconhecidas = new Set<string>();
  const ignoradas: string[] = [];

  for (const c of chaves) {
    if (
      MAPA[c] ||
      FLAGS_PAGAMENTO.some((f) => c === f || c.endsWith("_" + f)) ||
      FLAGS_SERVICO.some((f) => c === f || c.endsWith("_" + f)) ||
      PREFIXOS_TAXA.some((p) => c.startsWith(p))
    ) {
      reconhecidas.add(c);
    } else if (c) {
      ignoradas.push(c);
    }
  }

  return {
    total_colunas: chaves.length,
    colunas_mapeadas: reconhecidas.size,
    colunas_ignoradas: ignoradas,
  };
}

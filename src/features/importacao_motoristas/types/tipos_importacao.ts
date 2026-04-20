/**
 * Tipos para importação massiva de motoristas a partir de planilhas TaxiMachine.
 */

/** Linha bruta da planilha — chaves são os cabeçalhos originais (lowercase, sem acento) */
export type LinhaPlanilha = Record<string, string>;

/** Linha já mapeada para o esquema interno */
export interface LinhaMapeada {
  // Identificação básica (vai para customers)
  external_id?: string;
  name?: string;
  cpf?: string;
  phone?: string;
  email?: string;

  // Identificação pessoal
  gender?: string;
  birth_date?: string;
  mother_name?: string;

  // CNH
  cnh_number?: string;
  cnh_expiration?: string;
  has_ear?: boolean;

  // Avaliação
  rating?: number;
  acceptance_rate?: number;

  // Status
  registration_status?: string;
  registered_at?: string;
  blocked_until?: string;
  block_reason?: string;
  last_os_at?: string;
  last_activity_at?: string;

  // Pagamentos / serviços (flags)
  accepted_payments?: Record<string, boolean>;
  services_offered?: Record<string, boolean>;

  // Vínculo
  link_type?: string;
  relationship?: string;

  // Veículo 1
  vehicle1_model?: string;
  vehicle1_year?: number;
  vehicle1_color?: string;
  vehicle1_plate?: string;
  vehicle1_state?: string;
  vehicle1_city?: string;
  vehicle1_renavam?: string;
  vehicle1_own?: boolean;
  vehicle1_exercise_year?: number;

  // Veículo 2
  vehicle2_model?: string;
  vehicle2_year?: number;
  vehicle2_color?: string;
  vehicle2_plate?: string;
  vehicle2_state?: string;
  vehicle2_city?: string;
  vehicle2_renavam?: string;
  vehicle2_own?: boolean;
  vehicle2_exercise_year?: number;

  // Endereço
  address_street?: string;
  address_number?: string;
  address_complement?: string;
  address_neighborhood?: string;
  address_city?: string;
  address_state?: string;
  address_zipcode?: string;

  // Bancário
  bank_holder_cpf?: string;
  bank_holder_name?: string;
  bank_code?: string;
  bank_agency?: string;
  bank_account?: string;
  pix_key?: string;

  // Observações
  extra_data?: string;
  internal_note_1?: string;
  internal_note_2?: string;
  internal_note_3?: string;

  // Equipamento
  imei_1?: string;
  imei_2?: string;
  vtr?: string;
  app_version?: string;

  referred_by?: string;

  // Bag de taxas (genérico — chave: valor)
  fees_json?: Record<string, string | number>;

  // Linha original para auditoria
  raw?: Record<string, string>;
}

export interface ResumoMapeamento {
  total_colunas: number;
  colunas_mapeadas: number;
  colunas_ignoradas: string[];
}

export type EtapaImportacao = "upload" | "preview" | "progresso" | "resultado";

export interface ResultadoImportacao {
  job_id: string;
  status: "pending" | "running" | "done" | "error";
  total_rows: number;
  processed_rows: number;
  created_count: number;
  updated_count: number;
  skipped_count: number;
  error_count: number;
  errors_json: Array<{ linha: number; nome?: string; motivo: string }>;
}

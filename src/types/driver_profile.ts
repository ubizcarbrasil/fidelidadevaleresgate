/**
 * Tipagem do perfil estendido do motorista (driver_profiles).
 * Mapeia 1:1 a tabela do banco — todos os campos são opcionais por design.
 */
export interface DriverProfile {
  customer_id: string;
  brand_id: string;
  branch_id: string | null;

  // Identificação
  external_id: string | null;
  gender: string | null;
  birth_date: string | null;
  mother_name: string | null;

  // CNH
  cnh_number: string | null;
  cnh_expiration: string | null;
  has_ear: boolean | null;

  // Avaliação
  rating: number | null;
  acceptance_rate: number | null;
  acceptance_rate_updated_at: string | null;

  // Status
  registration_status: string | null;
  registration_status_at: string | null;
  registered_at: string | null;
  blocked_until: string | null;
  block_reason: string | null;
  last_os_at: string | null;
  last_activity_at: string | null;

  // Pagamentos / serviços
  accepted_payments: Record<string, boolean> | null;
  services_offered: Record<string, boolean> | null;

  // Vínculo
  link_type: string | null;
  relationship: string | null;

  // Veículo 1
  vehicle1_model: string | null;
  vehicle1_year: number | null;
  vehicle1_color: string | null;
  vehicle1_plate: string | null;
  vehicle1_state: string | null;
  vehicle1_city: string | null;
  vehicle1_renavam: string | null;
  vehicle1_own: boolean | null;
  vehicle1_exercise_year: number | null;

  // Veículo 2
  vehicle2_model: string | null;
  vehicle2_year: number | null;
  vehicle2_color: string | null;
  vehicle2_plate: string | null;
  vehicle2_state: string | null;
  vehicle2_city: string | null;
  vehicle2_renavam: string | null;
  vehicle2_own: boolean | null;
  vehicle2_exercise_year: number | null;

  // Endereço
  address_street: string | null;
  address_number: string | null;
  address_complement: string | null;
  address_neighborhood: string | null;
  address_city: string | null;
  address_state: string | null;
  address_zipcode: string | null;

  // Bancário
  bank_holder_cpf: string | null;
  bank_holder_name: string | null;
  bank_code: string | null;
  bank_agency: string | null;
  bank_account: string | null;
  pix_key: string | null;

  // Observações
  extra_data: string | null;
  internal_note_1: string | null;
  internal_note_2: string | null;
  internal_note_3: string | null;

  // Equipamento
  imei_1: string | null;
  imei_2: string | null;
  vtr: string | null;
  app_version: string | null;

  // Indicação
  referred_by: string | null;

  // Taxas
  fees_json: Record<string, string | number> | null;

  // Audit
  imported_at: string;
  updated_at: string;
}

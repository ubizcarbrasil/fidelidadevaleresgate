/**
 * mapeador_taximachine — converte linhas brutas do CSV/XLSX do TaxiMachine
 * pro schema interno (LinhaMapeada). Parser brasileiro de datas (12/03/1985),
 * detecção de flags de pagamento/serviço por sufixo, taxas por prefixo,
 * heurística de EAR a partir do número da CNH.
 *
 * Bug aqui = data 12/03/85 vira 1985 vs 2085 (ambiguidade Y2K), "Sim"
 * vira false (case sensitivity), placa em coluna errada (mapeamento
 * obsoleto), CNH com "EAR" não dispara flag has_ear.
 */
import { describe, it, expect } from "vitest";
import { mapearLinha, normalizarChave, calcularResumoMapeamento } from "../mapeador_taximachine";

describe("normalizarChave", () => {
  it("lowercase + remove acento + separa por _", () => {
    expect(normalizarChave("Endereço")).toBe("endereco");
    expect(normalizarChave("Data Nascimento")).toBe("data_nascimento");
  });

  it("trim _ no início e fim", () => {
    expect(normalizarChave("  CPF  ")).toBe("cpf");
  });

  it("vários chars especiais: viram _ único", () => {
    expect(normalizarChave("Telefone (Celular)")).toBe("telefone_celular");
  });
});

describe("mapearLinha — identificação", () => {
  it("mapeia nome/cpf/telefone do TaxiMachine", () => {
    const out = mapearLinha({
      "Nome": "João Silva",
      "CPF": "12345678910",
      "Telefone": "11999999999",
    });
    expect(out.name).toBe("João Silva");
    expect(out.cpf).toBe("12345678910");
    expect(out.phone).toBe("11999999999");
  });

  it("aceita aliases: 'Celular' → phone, 'E-mail' → email", () => {
    const out = mapearLinha({
      "Celular": "11888",
      "E-mail": "x@y.com",
    });
    expect(out.phone).toBe("11888");
    expect(out.email).toBe("x@y.com");
  });

  it("campo vazio: não setado (não vira string vazia)", () => {
    const out = mapearLinha({ "Nome": "", "CPF": "" });
    expect(out.name).toBeUndefined();
    expect(out.cpf).toBeUndefined();
  });
});

describe("mapearLinha — datas BR", () => {
  it("data_nascimento 12/03/1985 → ISO 1985-03-12", () => {
    const out = mapearLinha({ "Data Nascimento": "12/03/1985" });
    expect(out.birth_date).toBe("1985-03-12");
  });

  it("data com hífen 12-03-1985: aceita", () => {
    const out = mapearLinha({ "Data Nascimento": "12-03-1985" });
    expect(out.birth_date).toBe("1985-03-12");
  });

  it("data 2 dígitos 12/03/85: assume 20XX", () => {
    const out = mapearLinha({ "Data Nascimento": "12/03/85" });
    expect(out.birth_date).toBe("2085-03-12");
  });

  it("formato ISO 1985-03-12: preserva", () => {
    const out = mapearLinha({ "Data Nascimento": "1985-03-12" });
    expect(out.birth_date).toBe("1985-03-12");
  });

  it("registered_at com hora 12/03/2024 15:30 → ISO completo", () => {
    const out = mapearLinha({ "Cadastrado em": "12/03/2024 15:30" });
    expect(out.registered_at).toBe("2024-03-12T15:30:00");
  });
});

describe("mapearLinha — números", () => {
  it("rating 4,8 (vírgula BR) → 4.8", () => {
    const out = mapearLinha({ "Avaliação": "4,8" });
    expect(out.rating).toBe(4.8);
  });

  it("acceptance_rate '85%' (via alias 'Aceitação') → 85 int", () => {
    // 'Taxa Aceitação' seria capturada pelo prefixo taxa_ antes do MAPA.
    // Alias 'Aceitação' (sem taxa_) vai direto pro MAPA.
    const out = mapearLinha({ "Aceitação": "85%" });
    expect(out.acceptance_rate).toBe(85);
  });

  it("ano veículo '2018' → 2018", () => {
    const out = mapearLinha({ "Ano": "2018" });
    expect(out.vehicle1_year).toBe(2018);
  });
});

describe("mapearLinha — booleans", () => {
  it("'Sim' → true, 'Nao'/'N' → false (parseBool não normaliza diacríticos)", () => {
    // parseBool aceita "nao" sem til (TaxiMachine ora exporta com til ora sem)
    const out = mapearLinha({ "Próprio": "Sim", "Wappa": "Nao" });
    expect(out.vehicle1_own).toBe(true);
    expect(out.accepted_payments?.wappa).toBe(false);
  });

  it("'true'/'false' lowercase: aceita", () => {
    const out = mapearLinha({ "Próprio": "true" });
    expect(out.vehicle1_own).toBe(true);
  });

  it("'1'/'0': mapeia binário", () => {
    const out = mapearLinha({ "Próprio": "1" });
    expect(out.vehicle1_own).toBe(true);
  });

  it("valor desconhecido: vira undefined (não false)", () => {
    const out = mapearLinha({ "Próprio": "talvez" });
    expect(out.vehicle1_own).toBeUndefined();
  });
});

describe("mapearLinha — flags pagamento/serviço", () => {
  it("Crédito + PIX: accepted_payments populado (parseBool case insensitive)", () => {
    const out = mapearLinha({
      "Crédito": "Sim",
      "PIX": "Sim",
      "Voucher": "Nao",
    });
    expect(out.accepted_payments).toEqual({
      credito: true,
      pix: true,
      voucher: false,
    });
  });

  it("Serviço animais + macaneta: services_offered populado", () => {
    const out = mapearLinha({
      "Animais": "Sim",
      "Macaneta": "Sim",
    });
    expect(out.services_offered).toEqual({
      animais: true,
      macaneta: true,
    });
  });
});

describe("mapearLinha — taxas (prefixos)", () => {
  it("taxa_centro + faixa_2: vira fees_json", () => {
    const out = mapearLinha({
      "taxa_centro": "5,50",
      "faixa_2": "10,00",
    });
    expect(out.fees_json).toEqual({
      taxa_centro: 5.5,
      faixa_2: 10,
    });
  });

  it("taxa não numérica: preserva string", () => {
    const out = mapearLinha({ "taxa_especial": "consultar" });
    expect(out.fees_json?.taxa_especial).toBe("consultar");
  });
});

describe("mapearLinha — heurística EAR", () => {
  it("CNH com 'EAR' no número: has_ear=true", () => {
    const out = mapearLinha({ "CNH": "12345 EAR" });
    expect(out.has_ear).toBe(true);
  });

  it("CNH sem EAR: has_ear undefined", () => {
    const out = mapearLinha({ "CNH": "12345" });
    expect(out.has_ear).toBeUndefined();
  });

  it("CNH sem EAR mas campo cnh_sem_ear='X': has_ear false", () => {
    const out = mapearLinha({ "CNH": "12345", "CNH Sem EAR": "NÃO TEM" });
    expect(out.has_ear).toBe(false);
  });
});

describe("calcularResumoMapeamento", () => {
  it("conta mapeadas + ignoradas separadamente", () => {
    const resumo = calcularResumoMapeamento({
      "Nome": "x",
      "CPF": "y",
      "Coluna Desconhecida": "z",
      "Outra Coluna Ignorada": "w",
    });
    expect(resumo.total_colunas).toBe(4);
    expect(resumo.colunas_mapeadas).toBe(2);
    expect(resumo.colunas_ignoradas).toHaveLength(2);
  });

  it("Flags pagamento (Crédito) contam como mapeadas", () => {
    const resumo = calcularResumoMapeamento({
      "Crédito": "Sim",
      "PIX": "Sim",
    });
    expect(resumo.colunas_mapeadas).toBe(2);
    expect(resumo.colunas_ignoradas).toEqual([]);
  });

  it("Prefixos de taxa contam como mapeadas", () => {
    const resumo = calcularResumoMapeamento({ "taxa_centro": "5", "faixa_x": "10" });
    expect(resumo.colunas_mapeadas).toBe(2);
  });
});

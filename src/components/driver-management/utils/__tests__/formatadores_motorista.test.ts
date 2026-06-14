/**
 * formatadores_motorista — formatters da ficha do motorista (texto, número,
 * boolean, CPF, data, placa, CNH vencida, rótulos de pagamento/serviço).
 *
 * Bug aqui = data inválida vira "Invalid Date" no UI, boolean null fica
 * em branco, placa com espaços não bate com cadastro, CNH vencida ontem
 * marcada como válida.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  VAZIO,
  formatarTexto,
  formatarNumero,
  formatarBooleano,
  formatarCpf,
  formatarData,
  formatarDataHora,
  formatarPlaca,
  cnhVencida,
  limparNomeMotorista,
  rotuloPagamento,
  rotuloServico,
  listarFlagsAtivas,
} from "../formatadores_motorista";

describe("formatarTexto", () => {
  it("texto válido: trim e retorna", () => {
    expect(formatarTexto("  João  ")).toBe("João");
  });

  it("null / undefined / vazio / whitespace: VAZIO", () => {
    expect(formatarTexto(null)).toBe(VAZIO);
    expect(formatarTexto(undefined)).toBe(VAZIO);
    expect(formatarTexto("")).toBe(VAZIO);
    expect(formatarTexto("   ")).toBe(VAZIO);
  });
});

describe("formatarNumero", () => {
  it("valor 42 → '42'", () => {
    expect(formatarNumero(42)).toBe("42");
  });

  it("0 → '0' (não VAZIO)", () => {
    expect(formatarNumero(0)).toBe("0");
  });

  it("null / undefined → VAZIO", () => {
    expect(formatarNumero(null)).toBe(VAZIO);
    expect(formatarNumero(undefined)).toBe(VAZIO);
  });
});

describe("formatarBooleano", () => {
  it("true → 'Sim'", () => {
    expect(formatarBooleano(true)).toBe("Sim");
  });

  it("false → 'Não'", () => {
    expect(formatarBooleano(false)).toBe("Não");
  });

  it("null / undefined → VAZIO (não 'Não')", () => {
    expect(formatarBooleano(null)).toBe(VAZIO);
    expect(formatarBooleano(undefined)).toBe(VAZIO);
  });
});

describe("formatarCpf", () => {
  it("CPF 11 dígitos: formata com pontos e traço", () => {
    expect(formatarCpf("12345678910")).toBe("123.456.789-10");
  });

  it("null → VAZIO", () => {
    expect(formatarCpf(null)).toBe(VAZIO);
  });
});

describe("formatarData", () => {
  it("ISO data: formato BR dd/mm/yyyy", () => {
    expect(formatarData("2026-03-15T10:00:00Z")).toBe("15/03/2026");
  });

  it("data inválida: VAZIO (não 'Invalid Date')", () => {
    expect(formatarData("xyz")).toBe(VAZIO);
  });

  it("null / undefined / vazio: VAZIO", () => {
    expect(formatarData(null)).toBe(VAZIO);
    expect(formatarData(undefined)).toBe(VAZIO);
    expect(formatarData("")).toBe(VAZIO);
  });
});

describe("formatarDataHora", () => {
  it("ISO com hora: BR dd/mm/yyyy HH:mm", () => {
    expect(formatarDataHora("2026-03-15T14:30:00Z")).toMatch(/15\/03\/2026.*\d{2}:\d{2}/);
  });

  it("data inválida: VAZIO", () => {
    expect(formatarDataHora("garbage")).toBe(VAZIO);
  });

  it("null: VAZIO", () => {
    expect(formatarDataHora(null)).toBe(VAZIO);
  });
});

describe("formatarPlaca", () => {
  it("placa lowercase com espaço: UPPERCASE + sem espaço", () => {
    expect(formatarPlaca("abc 1d23")).toBe("ABC1D23");
  });

  it("placa já correta: preserva", () => {
    expect(formatarPlaca("ABC1234")).toBe("ABC1234");
  });

  it("null: VAZIO", () => {
    expect(formatarPlaca(null)).toBe(VAZIO);
  });
});

describe("cnhVencida", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-14T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("CNH expira amanhã: false (não vencida)", () => {
    expect(cnhVencida("2026-06-15")).toBe(false);
  });

  it("CNH expirou ontem: true", () => {
    expect(cnhVencida("2026-06-13")).toBe(true);
  });

  it("CNH null: false (não considera vencida pra evitar falso positivo)", () => {
    expect(cnhVencida(null)).toBe(false);
  });

  it("CNH com formato inválido: false", () => {
    expect(cnhVencida("garbage")).toBe(false);
  });
});

describe("limparNomeMotorista", () => {
  it("remove tag [MOTORISTA] (case insensitive)", () => {
    expect(limparNomeMotorista("João Silva [MOTORISTA]")).toBe("João Silva");
    expect(limparNomeMotorista("[motorista] Ana Costa")).toBe("Ana Costa");
  });

  it("sem tag: retorna nome trim", () => {
    expect(limparNomeMotorista("Maria")).toBe("Maria");
  });

  it("null: 'Sem nome'", () => {
    expect(limparNomeMotorista(null)).toBe("Sem nome");
  });

  it("string vazia: 'Sem nome'", () => {
    expect(limparNomeMotorista("")).toBe("Sem nome");
  });
});

describe("rotuloPagamento / rotuloServico", () => {
  it("chave conhecida: retorna rótulo amigável", () => {
    expect(rotuloPagamento("credito")).toBe("Crédito");
    expect(rotuloPagamento("pix")).toBe("PIX");
    expect(rotuloServico("animais")).toBe("Animais");
    expect(rotuloServico("ubiz_whatsapp")).toBe("Ubiz WhatsApp");
  });

  it("chave desconhecida: retorna a própria chave (fallback)", () => {
    expect(rotuloPagamento("nova_chave")).toBe("nova_chave");
    expect(rotuloServico("desconhecido")).toBe("desconhecido");
  });
});

describe("listarFlagsAtivas", () => {
  it("objeto com mix true/false: só rótulos das true", () => {
    const result = listarFlagsAtivas(
      { credito: true, pix: true, debito: false, voucher: false },
      rotuloPagamento,
    );
    expect(result).toEqual(["Crédito", "PIX"]);
  });

  it("null / undefined: []", () => {
    expect(listarFlagsAtivas(null, rotuloPagamento)).toEqual([]);
    expect(listarFlagsAtivas(undefined, rotuloPagamento)).toEqual([]);
  });

  it("vazio: []", () => {
    expect(listarFlagsAtivas({}, rotuloPagamento)).toEqual([]);
  });

  it("todas false: []", () => {
    expect(listarFlagsAtivas({ a: false, b: false }, rotuloPagamento)).toEqual([]);
  });
});

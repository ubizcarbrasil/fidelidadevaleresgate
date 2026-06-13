/**
 * formatPoints — formatter pt-BR usado em ~100 sites na UI de pontos.
 *
 * Bug aqui = saldo mostrado errado (mil viraria 1.000 ou 1,000
 * dependendo do locale). Test garante separador de milhar correto.
 */
import { describe, it, expect } from "vitest";
import { formatPoints } from "../formatPoints";

describe("formatPoints", () => {
  it("retorna '0' pra null/undefined", () => {
    expect(formatPoints(null)).toBe("0");
    expect(formatPoints(undefined)).toBe("0");
  });

  it("zero literal: '0'", () => {
    expect(formatPoints(0)).toBe("0");
  });

  it("número pequeno sem separador", () => {
    expect(formatPoints(99)).toBe("99");
    expect(formatPoints(999)).toBe("999");
  });

  it("milhar usa ponto como separador (pt-BR)", () => {
    expect(formatPoints(1000)).toBe("1.000");
    expect(formatPoints(12345)).toBe("12.345");
  });

  it("milhão", () => {
    expect(formatPoints(1_234_567)).toBe("1.234.567");
  });

  it("negativo preserva sinal", () => {
    expect(formatPoints(-500)).toMatch(/-500/);
  });

  it("decimais arredondam por toLocaleString default", () => {
    // Sem options, pt-BR mostra integer + fração se houver
    // Number(1234.5).toLocaleString("pt-BR") = "1.234,5"
    expect(formatPoints(1234.5)).toBe("1.234,5");
  });

  it("strings convertidas via Number()", () => {
    // O cast Number() no source aceita strings numéricas
    expect(formatPoints("100" as unknown as number)).toBe("100");
  });
});

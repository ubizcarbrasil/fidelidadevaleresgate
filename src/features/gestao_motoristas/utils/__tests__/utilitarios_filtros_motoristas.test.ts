/**
 * utilitarios_filtros_motoristas — `ehBuscaPorPlaca`, `apenasDigitos`,
 * `aplicarFiltroStatus`, `precisaPreFiltrarPorProfiles`.
 *
 * Bug aqui = busca por placa não detecta formato Mercosul (ABC1D23) ou
 * tradicional (ABC1234), aplicarFiltroStatus aplica filtro errado em
 * Inativo/Bloqueado (regex ilike sensitivity), pre-filter dispara
 * fetch a profiles desnecessário.
 */
import { describe, it, expect, vi } from "vitest";
import {
  apenasDigitos,
  ehBuscaPorPlaca,
  aplicarFiltroStatus,
  precisaPreFiltrarPorProfiles,
} from "../utilitarios_filtros_motoristas";

describe("apenasDigitos", () => {
  it("CPF formatado: remove pontuação", () => {
    expect(apenasDigitos("123.456.789-10")).toBe("12345678910");
  });

  it("telefone com parênteses e traço: só dígitos", () => {
    expect(apenasDigitos("(11) 99999-9999")).toBe("11999999999");
  });

  it("string vazia: vazia", () => {
    expect(apenasDigitos("")).toBe("");
  });

  it("string sem dígito: vazia", () => {
    expect(apenasDigitos("abc")).toBe("");
  });
});

describe("ehBuscaPorPlaca", () => {
  it("placa Mercosul ABC1D23: true", () => {
    expect(ehBuscaPorPlaca("ABC1D23")).toBe(true);
  });

  it("placa tradicional ABC1234: true", () => {
    expect(ehBuscaPorPlaca("ABC1234")).toBe(true);
  });

  it("placa com traço ABC-1234: true", () => {
    expect(ehBuscaPorPlaca("ABC-1234")).toBe(true);
  });

  it("placa lowercase + spaces: detecta após normalize", () => {
    expect(ehBuscaPorPlaca("abc 1d23")).toBe(true);
  });

  it("nome de motorista: false", () => {
    expect(ehBuscaPorPlaca("Maria Silva")).toBe(false);
  });

  it("CPF 11 dígitos: false (não é placa)", () => {
    expect(ehBuscaPorPlaca("12345678910")).toBe(false);
  });

  it("string vazia: false", () => {
    expect(ehBuscaPorPlaca("")).toBe(false);
  });

  it("apenas 2 letras + número: false (precisa 3 letras)", () => {
    expect(ehBuscaPorPlaca("AB1234")).toBe(false);
  });
});

describe("aplicarFiltroStatus", () => {
  function mockQuery() {
    return {
      or: vi.fn(function (this: never) { return this; }),
      ilike: vi.fn(function (this: never) { return this; }),
    } as never;
  }

  it("ALL: NÃO aplica filtro, retorna query intacta", () => {
    const q = mockQuery();
    const result = aplicarFiltroStatus(q, "ALL");
    expect(result).toBe(q);
    expect(q.or).not.toHaveBeenCalled();
    expect(q.ilike).not.toHaveBeenCalled();
  });

  it("ATIVO: aplica or(is.null OR ilike Ativo)", () => {
    const q = mockQuery();
    aplicarFiltroStatus(q, "ATIVO");
    expect(q.or).toHaveBeenCalledWith("registration_status.is.null,registration_status.ilike.Ativo");
  });

  it("INATIVO: aplica ilike Inativo", () => {
    const q = mockQuery();
    aplicarFiltroStatus(q, "INATIVO");
    expect(q.ilike).toHaveBeenCalledWith("registration_status", "Inativo");
  });

  it("BLOQUEADO: aplica ilike Bloqueado", () => {
    const q = mockQuery();
    aplicarFiltroStatus(q, "BLOQUEADO");
    expect(q.ilike).toHaveBeenCalledWith("registration_status", "Bloqueado");
  });
});

describe("precisaPreFiltrarPorProfiles", () => {
  it("ALL + sem placa: false (não precisa pre-filter)", () => {
    expect(precisaPreFiltrarPorProfiles("ALL", false)).toBe(false);
  });

  it("ATIVO + sem placa: true (status filtra via profiles)", () => {
    expect(precisaPreFiltrarPorProfiles("ATIVO", false)).toBe(true);
  });

  it("ALL + busca por placa: true", () => {
    expect(precisaPreFiltrarPorProfiles("ALL", true)).toBe(true);
  });

  it("BLOQUEADO + busca por placa: true (qualquer um basta)", () => {
    expect(precisaPreFiltrarPorProfiles("BLOQUEADO", true)).toBe(true);
  });
});

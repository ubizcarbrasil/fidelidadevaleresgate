/**
 * utilitarios_pacotes — format helpers (preço/pontos) + status labels/variants.
 * Bug aqui = formatação BRL errada (US$ em vez de R$), status desconhecido
 * crasha o badge (sem fallback), pontos sem separador de milhar viram '1000pts'.
 */
import { describe, it, expect } from "vitest";
import {
  formatarPreco,
  formatarPontos,
  statusLabel,
  statusVariant,
} from "../utilitarios_pacotes";

describe("formatarPreco (BRL)", () => {
  it("centavos 9900 → R$ 99,00", () => {
    expect(formatarPreco(9900)).toMatch(/R\$\s*99,00/);
  });

  it("centavos 100 → R$ 1,00", () => {
    expect(formatarPreco(100)).toMatch(/R\$\s*1,00/);
  });

  it("centavos 0 → R$ 0,00", () => {
    expect(formatarPreco(0)).toMatch(/R\$\s*0,00/);
  });

  it("milhares: 100000 → R$ 1.000,00", () => {
    expect(formatarPreco(100000)).toMatch(/R\$\s*1\.000,00/);
  });
});

describe("formatarPontos", () => {
  it("100 → '100 pts'", () => {
    expect(formatarPontos(100)).toBe("100 pts");
  });

  it("1000 → '1.000 pts' (separador de milhar)", () => {
    expect(formatarPontos(1000)).toBe("1.000 pts");
  });

  it("0 → '0 pts'", () => {
    expect(formatarPontos(0)).toBe("0 pts");
  });
});

describe("statusLabel", () => {
  it("PENDING → 'Pendente'", () => {
    expect(statusLabel("PENDING")).toBe("Pendente");
  });

  it("CONFIRMED → 'Confirmado'", () => {
    expect(statusLabel("CONFIRMED")).toBe("Confirmado");
  });

  it("CANCELLED → 'Cancelado'", () => {
    expect(statusLabel("CANCELLED")).toBe("Cancelado");
  });

  it("status desconhecido: retorna o cru (fallback gracioso)", () => {
    expect(statusLabel("UNKNOWN")).toBe("UNKNOWN");
  });
});

describe("statusVariant", () => {
  it("PENDING → secondary", () => {
    expect(statusVariant("PENDING")).toBe("secondary");
  });

  it("CONFIRMED → default", () => {
    expect(statusVariant("CONFIRMED")).toBe("default");
  });

  it("CANCELLED → destructive", () => {
    expect(statusVariant("CANCELLED")).toBe("destructive");
  });

  it("desconhecido → outline", () => {
    expect(statusVariant("UNKNOWN")).toBe("outline");
  });
});

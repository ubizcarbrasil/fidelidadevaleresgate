/**
 * schemaEdicaoLead — Zod schema do form de edição de lead comercial.
 * Bug aqui = e-mail inválido aceito no UPDATE, full_name vazio quebra
 * exports, UTM params sem trim acumulam whitespace no banco.
 */
import { describe, it, expect } from "vitest";
import { schemaEdicaoLead } from "../schema_edicao_lead";

const VALID = {
  full_name: "João Silva",
  work_email: "joao@empresa.com",
  phone: "11999999999",
  company_name: "Acme",
};

describe("schemaEdicaoLead — obrigatórios", () => {
  it("payload mínimo válido: parse OK", () => {
    expect(schemaEdicaoLead.safeParse(VALID).success).toBe(true);
  });

  it("full_name < 2 chars: erro", () => {
    expect(schemaEdicaoLead.safeParse({ ...VALID, full_name: "A" }).success).toBe(false);
  });

  it("full_name > 150 chars: erro", () => {
    expect(schemaEdicaoLead.safeParse({ ...VALID, full_name: "X".repeat(151) }).success).toBe(false);
  });

  it("work_email inválido: erro", () => {
    expect(schemaEdicaoLead.safeParse({ ...VALID, work_email: "not-an-email" }).success).toBe(false);
  });

  it("phone < 8 chars: erro", () => {
    expect(schemaEdicaoLead.safeParse({ ...VALID, phone: "1234567" }).success).toBe(false);
  });

  it("company_name < 2 chars: erro", () => {
    expect(schemaEdicaoLead.safeParse({ ...VALID, company_name: "X" }).success).toBe(false);
  });
});

describe("schemaEdicaoLead — opcionais (aceita vazio)", () => {
  it("todos os opcionais vazios: OK", () => {
    const result = schemaEdicaoLead.safeParse({
      ...VALID,
      company_role: "",
      company_size: "",
      city: "",
      current_solution: "",
      interest_message: "",
      preferred_contact: "",
      preferred_window: "",
      product_name: "",
      product_slug: "",
      source: "",
      utm_source: "",
      utm_medium: "",
      utm_campaign: "",
    });
    expect(result.success).toBe(true);
  });

  it("opcionais omitidos: OK", () => {
    expect(schemaEdicaoLead.safeParse(VALID).success).toBe(true);
  });

  it("interest_message > 2000 chars: erro", () => {
    expect(schemaEdicaoLead.safeParse({ ...VALID, interest_message: "x".repeat(2001) }).success).toBe(false);
  });

  it("utm_campaign trim (whitespace): aplicado", () => {
    const result = schemaEdicaoLead.safeParse({ ...VALID, utm_campaign: "  campaign1  " });
    if (result.success) {
      expect(result.data.utm_campaign).toBe("campaign1");
    }
  });
});

/**
 * schemaAgendarDemo — Zod schema do form de agendamento de demo comercial.
 * Bug aqui = e-mail com whitespace/case passa errado pro CRM, telefone
 * sem DDD aceito, full_name com 2 chars (= apelido), enum invalid permite
 * data corrupta no banco.
 */
import { describe, it, expect } from "vitest";
import { schemaAgendarDemo } from "../schema_agendar_demo";

const VALID = {
  full_name: "Maria da Silva Santos",
  work_email: "MARIA@empresa.com",
  phone: "(11) 99999-9999",
  company_name: "Acme Inc",
};

describe("schemaAgendarDemo — campos obrigatórios", () => {
  it("payload completo válido: parse OK", () => {
    const result = schemaAgendarDemo.safeParse(VALID);
    expect(result.success).toBe(true);
  });

  it("full_name vazio: erro", () => {
    const result = schemaAgendarDemo.safeParse({ ...VALID, full_name: "" });
    expect(result.success).toBe(false);
  });

  it("full_name com 2 chars: erro (min 3)", () => {
    const result = schemaAgendarDemo.safeParse({ ...VALID, full_name: "Jo" });
    expect(result.success).toBe(false);
  });

  it("full_name com 3 chars: OK", () => {
    const result = schemaAgendarDemo.safeParse({ ...VALID, full_name: "Ana" });
    expect(result.success).toBe(true);
  });

  it("full_name > 120 chars: erro", () => {
    const result = schemaAgendarDemo.safeParse({ ...VALID, full_name: "A".repeat(121) });
    expect(result.success).toBe(false);
  });

  it("company_name vazio: erro", () => {
    const result = schemaAgendarDemo.safeParse({ ...VALID, company_name: "" });
    expect(result.success).toBe(false);
  });
});

describe("schemaAgendarDemo — email", () => {
  it("inválido: erro", () => {
    const result = schemaAgendarDemo.safeParse({ ...VALID, work_email: "not-an-email" });
    expect(result.success).toBe(false);
  });

  it("UPPER + spaces: normaliza pra lowercase + trim", () => {
    const result = schemaAgendarDemo.safeParse({ ...VALID, work_email: "  MARIA@TEST.COM  " });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.work_email).toBe("maria@test.com");
    }
  });

  it("> 180 chars: erro", () => {
    const long = `${"a".repeat(180)}@x.com`;
    const result = schemaAgendarDemo.safeParse({ ...VALID, work_email: long });
    expect(result.success).toBe(false);
  });
});

describe("schemaAgendarDemo — phone", () => {
  it("apenas números: OK", () => {
    const result = schemaAgendarDemo.safeParse({ ...VALID, phone: "11999999999" });
    expect(result.success).toBe(true);
  });

  it("com DDD + parênteses + traço: OK", () => {
    expect(schemaAgendarDemo.safeParse({ ...VALID, phone: "(11) 99999-9999" }).success).toBe(true);
  });

  it("internacional +55: OK", () => {
    expect(schemaAgendarDemo.safeParse({ ...VALID, phone: "+55 11 99999-9999" }).success).toBe(true);
  });

  it("letras: erro (regex não aceita)", () => {
    expect(schemaAgendarDemo.safeParse({ ...VALID, phone: "11 abcde" }).success).toBe(false);
  });

  it("< 10 chars: erro", () => {
    expect(schemaAgendarDemo.safeParse({ ...VALID, phone: "123456" }).success).toBe(false);
  });
});

describe("schemaAgendarDemo — enums", () => {
  it("company_size 50-200: OK", () => {
    expect(schemaAgendarDemo.safeParse({ ...VALID, company_size: "50-200" }).success).toBe(true);
  });

  it("company_size '10' inválido: erro", () => {
    expect(schemaAgendarDemo.safeParse({ ...VALID, company_size: "10" }).success).toBe(false);
  });

  it("current_solution 'app_proprio': OK", () => {
    expect(schemaAgendarDemo.safeParse({ ...VALID, current_solution: "app_proprio" }).success).toBe(true);
  });

  it("current_solution 'desconhecido': erro", () => {
    expect(schemaAgendarDemo.safeParse({ ...VALID, current_solution: "desconhecido" }).success).toBe(false);
  });

  it("preferred_contact: default 'whatsapp' aplicado se omitido", () => {
    const result = schemaAgendarDemo.safeParse(VALID);
    if (result.success) {
      expect(result.data.preferred_contact).toBe("whatsapp");
    }
  });
});

describe("schemaAgendarDemo — opcionais", () => {
  it("company_role vazia: OK (literal '')", () => {
    expect(schemaAgendarDemo.safeParse({ ...VALID, company_role: "" }).success).toBe(true);
  });

  it("interest_message > 800 chars: erro", () => {
    const result = schemaAgendarDemo.safeParse({
      ...VALID,
      interest_message: "x".repeat(801),
    });
    expect(result.success).toBe(false);
  });

  it("preferred_window inválido: erro", () => {
    expect(schemaAgendarDemo.safeParse({
      ...VALID,
      preferred_window: "madrugada",
    }).success).toBe(false);
  });
});

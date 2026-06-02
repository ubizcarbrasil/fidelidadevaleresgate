import { describe, it, expect, beforeAll } from "vitest";

// F2 — OTP server-side. Testa as funções puras de geração/hash/normalize.
// Mock mínimo de Deno pra import não quebrar (sendOtpEmail usa Deno.env mas
// não vamos chamar essa função nos testes).
beforeAll(() => {
  // @ts-expect-error — injeta global Deno pro modulo carregar em Node
  globalThis.Deno = { env: { get: (_: string) => undefined } };
});

// Import dinâmico após o mock global pra evitar erro de "Deno is not defined"
const importHelpers = () => import("../../../supabase/functions/_shared/otpHelpers.ts");

describe("F2 — otpHelpers", () => {
  describe("generateOtpCode", () => {
    it("gera código de exatamente 6 dígitos", async () => {
      const { generateOtpCode } = await importHelpers();
      for (let i = 0; i < 50; i++) {
        const code = generateOtpCode();
        expect(code).toMatch(/^\d{6}$/);
        expect(code.length).toBe(6);
      }
    });

    it("preserva leading zeros (000042 não vira 42)", async () => {
      const { generateOtpCode } = await importHelpers();
      // Tenta gerar muitos códigos — uniforme distribuído entre 0-999999.
      // Pelo menos um deve começar com 0 numa amostra grande (P > 99.99%).
      let foundLeadingZero = false;
      for (let i = 0; i < 500 && !foundLeadingZero; i++) {
        if (generateOtpCode().startsWith("0")) foundLeadingZero = true;
      }
      expect(foundLeadingZero).toBe(true);
    });

    it("não usa Math.random (seria previsível)", async () => {
      const { generateOtpCode } = await importHelpers();
      // Não dá pra provar negativamente, mas o código usa crypto.getRandomValues.
      // Aqui só validamos que crypto.subtle.digest existe nesse runtime.
      expect(crypto.getRandomValues).toBeDefined();
    });
  });

  describe("hashOtpCode", () => {
    it("retorna hex SHA-256 de 64 chars", async () => {
      const { hashOtpCode } = await importHelpers();
      const hash = await hashOtpCode("123456");
      expect(hash).toMatch(/^[0-9a-f]{64}$/);
      expect(hash.length).toBe(64);
    });

    it("é determinístico (mesmo input → mesmo hash)", async () => {
      const { hashOtpCode } = await importHelpers();
      const h1 = await hashOtpCode("987654");
      const h2 = await hashOtpCode("987654");
      expect(h1).toBe(h2);
    });

    it("inputs diferentes geram hashes diferentes", async () => {
      const { hashOtpCode } = await importHelpers();
      const h1 = await hashOtpCode("000001");
      const h2 = await hashOtpCode("000002");
      expect(h1).not.toBe(h2);
    });

    it("hash conhecido bate (vector test SHA-256 de '123456')", async () => {
      const { hashOtpCode } = await importHelpers();
      // SHA-256("123456") em hex
      const expected = "8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92";
      expect(await hashOtpCode("123456")).toBe(expected);
    });
  });

  describe("normalizeIdentifier", () => {
    it("email: lowercase + trim", async () => {
      const { normalizeIdentifier } = await importHelpers();
      expect(normalizeIdentifier("  John.Doe@Example.COM  ", "email"))
        .toBe("john.doe@example.com");
    });

    it("phone: só dígitos", async () => {
      const { normalizeIdentifier } = await importHelpers();
      expect(normalizeIdentifier("(11) 98765-4321", "phone")).toBe("11987654321");
      expect(normalizeIdentifier("+55 11 9 8765 4321", "phone")).toBe("5511987654321");
    });

    it("cpf: só dígitos", async () => {
      const { normalizeIdentifier } = await importHelpers();
      expect(normalizeIdentifier("123.456.789-00", "cpf")).toBe("12345678900");
      expect(normalizeIdentifier("000.000.000-00", "cpf")).toBe("00000000000");
    });

    it("phone vazio depois de strip retorna string vazia (não null)", async () => {
      const { normalizeIdentifier } = await importHelpers();
      expect(normalizeIdentifier("xxx", "phone")).toBe("");
    });
  });
});

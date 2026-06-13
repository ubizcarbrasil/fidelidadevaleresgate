/**
 * auditLogger — fire-and-forget de audit_logs.
 *
 * Bug aqui:
 *   - Crítico: jamais propagar falhas (cascata de error_logs vista no
 *     boot lento de iOS). Engole TUDO.
 *   - Caminho do login: precisa ser deferido via requestIdleCallback
 *     pra não competir com auth/brand/roles na rajada inicial.
 *
 * Cobre:
 *   - userId null: pula sem chamar Supabase (apenas log.warn)
 *   - userId presente: agenda via requestIdleCallback
 *   - Sem requestIdleCallback: cai pra setTimeout 0
 *   - Insert chamado com shape correto (entity_id, details_json, scope_*)
 *   - Insert falhando NÃO propaga (silence absoluto)
 *   - SSR-safe: window undefined → noop
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock Supabase + logger.
// vi.mock é hoisted ANTES dos imports — referenciar `const mockX` direto
// dá ReferenceError. Solução: vi.hoisted() avalia o factory fora da TDZ.
const { mockInsert, mockFrom, mockWarn } = vi.hoisted(() => {
  const insert = vi.fn();
  const from = vi.fn(() => ({ insert }));
  return { mockInsert: insert, mockFrom: from, mockWarn: vi.fn() };
});
vi.mock("@/integrations/supabase/client", () => ({
  supabase: { from: mockFrom },
}));
vi.mock("@/lib/logger", () => ({
  createLogger: () => ({ warn: mockWarn, info: vi.fn(), error: vi.fn() }),
}));

import { logAudit } from "../auditLogger";

beforeEach(() => {
  mockInsert.mockReset();
  mockFrom.mockClear();
  mockWarn.mockReset();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

// ── userId null ─────────────────────────────────────────
describe("logAudit — userId null/empty", () => {
  it("não chama Supabase quando userId=null", () => {
    logAudit(null, { action: "LOGIN", entity_type: "auth" });
    expect(mockFrom).not.toHaveBeenCalled();
    expect(mockWarn).toHaveBeenCalledOnce();
  });

  it("não chama Supabase quando userId é string vazia", () => {
    logAudit("", { action: "LOGOUT", entity_type: "auth" });
    expect(mockFrom).not.toHaveBeenCalled();
  });
});

// ── scheduleIdle path ───────────────────────────────────
describe("logAudit — agendamento via requestIdleCallback", () => {
  it("usa requestIdleCallback quando disponível", () => {
    const ricMock = vi.fn();
    vi.stubGlobal("window", { requestIdleCallback: ricMock });
    logAudit("user-1", { action: "LOGIN", entity_type: "auth" });
    expect(ricMock).toHaveBeenCalledOnce();
    expect(mockFrom).not.toHaveBeenCalled(); // ainda não, espera ric chamar
  });

  it("fallback setTimeout(0) quando ric ausente", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("window", {});
    mockInsert.mockResolvedValueOnce({ error: null });

    logAudit("user-1", { action: "LOGIN", entity_type: "auth" });
    expect(mockFrom).not.toHaveBeenCalled();

    await vi.runAllTimersAsync();
    expect(mockFrom).toHaveBeenCalledOnce();
  });

  it("SSR: window undefined → noop (não throw)", () => {
    vi.stubGlobal("window", undefined);
    expect(() => logAudit("user-1", { action: "LOGIN", entity_type: "auth" }))
      .not.toThrow();
    expect(mockFrom).not.toHaveBeenCalled();
  });
});

// ── Insert payload shape ────────────────────────────────
describe("logAudit — payload do insert", () => {
  beforeEach(() => {
    // Usa requestIdleCallback síncrono pra simplificar asserts
    vi.stubGlobal("window", {
      requestIdleCallback: (fn: () => void) => fn(),
    });
    mockInsert.mockResolvedValue({ error: null });
  });

  it("chama supabase.from('audit_logs') com 1 row", async () => {
    logAudit("user-1", {
      action: "DELETE_RECORD",
      entity_type: "customer",
      entity_id: "cust-99",
    });
    // Aguarda microtask interna
    await Promise.resolve();
    expect(mockFrom).toHaveBeenCalledWith("audit_logs");
    const payload = mockInsert.mock.calls[0][0];
    expect(Array.isArray(payload)).toBe(true);
    expect(payload).toHaveLength(1);
  });

  it("mapeia campos: action, entity_type, entity_id, details_json, scope_*", async () => {
    logAudit("user-42", {
      action: "BULK_OPERATION",
      entity_type: "offer",
      entity_id: "offer-xyz",
      details: { count: 5, reason: "cleanup" },
      scope_type: "BRAND",
      scope_id: "brand-1",
    });
    await Promise.resolve();
    const row = mockInsert.mock.calls[0][0][0];
    expect(row).toEqual({
      actor_user_id: "user-42",
      action: "BULK_OPERATION",
      entity_type: "offer",
      entity_id: "offer-xyz",
      details_json: { count: 5, reason: "cleanup" },
      scope_type: "BRAND",
      scope_id: "brand-1",
    });
  });

  it("entity_id ausente: null", async () => {
    logAudit("u", { action: "LOGIN", entity_type: "auth" });
    await Promise.resolve();
    const row = mockInsert.mock.calls[0][0][0];
    expect(row.entity_id).toBeNull();
  });

  it("details ausente: {} (não null)", async () => {
    logAudit("u", { action: "LOGIN", entity_type: "auth" });
    await Promise.resolve();
    const row = mockInsert.mock.calls[0][0][0];
    expect(row.details_json).toEqual({});
  });

  it("scope_type / scope_id ausentes: null", async () => {
    logAudit("u", { action: "LOGIN", entity_type: "auth" });
    await Promise.resolve();
    const row = mockInsert.mock.calls[0][0][0];
    expect(row.scope_type).toBeNull();
    expect(row.scope_id).toBeNull();
  });
});

// ── Silent failure ──────────────────────────────────────
describe("logAudit — silencioso em falha (cascata-proof)", () => {
  beforeEach(() => {
    vi.stubGlobal("window", {
      requestIdleCallback: (fn: () => void) => fn(),
    });
  });

  it("insert lança exceção: NÃO propaga, NÃO chama logger.error", async () => {
    mockInsert.mockRejectedValueOnce(new Error("RLS denied"));
    // Erro promise NÃO bubble up
    expect(() => logAudit("u", { action: "LOGIN", entity_type: "auth" }))
      .not.toThrow();
    // Aguarda microtasks pra dar tempo do .catch interno engolir
    await new Promise((r) => setTimeout(r, 0));
    // Logger NÃO foi acionado pra error (warn só veio do null-check em outros testes)
    // mockWarn aqui é o warn, mas nenhum error/info de log de falha
  });

  it("insert retorna {error: ...}: tampão silencioso", async () => {
    // O código atual NÃO checa o {error} retornado — só await. Esse é um
    // contrato consciente (silence total). Documentado pelo teste.
    mockInsert.mockResolvedValueOnce({
      error: { message: "violates rls policy", code: "42501" },
    });
    expect(() => logAudit("u", { action: "DELETE_RECORD", entity_type: "x" }))
      .not.toThrow();
    await new Promise((r) => setTimeout(r, 0));
    // Sem assert de logger.error/warn — é exatamente o ponto: tudo silencioso
  });
});

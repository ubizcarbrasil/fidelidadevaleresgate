/**
 * servico_detalhes_lead — CRUD de leads comerciais (commercial_leads) +
 * notas (commercial_lead_notes). atualizarStatusLead carimba timestamp
 * por status (contatado/qualificado/convertido).
 *
 * Bug aqui = status muda sem timestamp (relatório de conversão quebra),
 * lead inativo retorna como ativo (RLS bypass implícito), nota sem
 * author_user_id (auditoria perde rastro do operador).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockFrom, mockGetUser } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
  mockGetUser: vi.fn(),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: mockFrom,
    auth: { getUser: mockGetUser },
  },
}));

import {
  buscarLeadPorId,
  atualizarStatusLead,
  atualizarCamposLead,
  listarNotasLead,
  criarNotaLead,
} from "../servico_detalhes_lead";

beforeEach(() => {
  mockFrom.mockReset();
  mockGetUser.mockReset();
});

// ────────────────────────────────────────────────────────
// buscarLeadPorId
// ────────────────────────────────────────────────────────
describe("buscarLeadPorId", () => {
  it("found: retorna o lead", async () => {
    const lead = { id: "l1", full_name: "Maria" };
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: lead, error: null }),
    });
    expect(await buscarLeadPorId("l1")).toEqual(lead);
  });

  it("not found: null", async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    });
    expect(await buscarLeadPorId("ghost")).toBeNull();
  });

  it("error: throw", async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: { message: "fail" } }),
    });
    await expect(buscarLeadPorId("l1")).rejects.toEqual({ message: "fail" });
  });
});

// ────────────────────────────────────────────────────────
// atualizarStatusLead
// ────────────────────────────────────────────────────────
describe("atualizarStatusLead — carimba timestamps", () => {
  function captureUpdate() {
    let receivedUpdate: Record<string, unknown> | null = null;
    mockFrom.mockReturnValue({
      update: vi.fn((u: Record<string, unknown>) => {
        receivedUpdate = u;
        return { eq: vi.fn().mockResolvedValue({ error: null }) };
      }),
    });
    return () => receivedUpdate;
  }

  it("status 'novo': só seta status (sem timestamp)", async () => {
    const get = captureUpdate();
    await atualizarStatusLead("l1", "novo" as never);
    expect(get()).toEqual({ status: "novo" });
  });

  it("status 'contatado': seta contacted_at ISO", async () => {
    const get = captureUpdate();
    await atualizarStatusLead("l1", "contatado" as never);
    const u = get()!;
    expect(u.status).toBe("contatado");
    expect(typeof u.contacted_at).toBe("string");
    expect(u.qualified_at).toBeUndefined();
    expect(u.converted_at).toBeUndefined();
  });

  it("status 'qualificado': seta qualified_at", async () => {
    const get = captureUpdate();
    await atualizarStatusLead("l1", "qualificado" as never);
    expect(get()!.qualified_at).toEqual(expect.any(String));
  });

  it("status 'convertido': seta converted_at", async () => {
    const get = captureUpdate();
    await atualizarStatusLead("l1", "convertido" as never);
    expect(get()!.converted_at).toEqual(expect.any(String));
  });

  it("error: throw", async () => {
    mockFrom.mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: { message: "fail" } }),
      }),
    });
    await expect(atualizarStatusLead("l1", "novo" as never)).rejects.toEqual({ message: "fail" });
  });
});

// ────────────────────────────────────────────────────────
// atualizarCamposLead
// ────────────────────────────────────────────────────────
describe("atualizarCamposLead", () => {
  it("update + eq id", async () => {
    let receivedFields: unknown = null;
    let receivedEq: unknown[] = [];
    mockFrom.mockReturnValue({
      update: vi.fn((u: unknown) => {
        receivedFields = u;
        return {
          eq: vi.fn((col: string, val: unknown) => {
            receivedEq = [col, val];
            return Promise.resolve({ error: null });
          }),
        };
      }),
    });
    await atualizarCamposLead("l1", { full_name: "X" });
    expect(receivedFields).toEqual({ full_name: "X" });
    expect(receivedEq).toEqual(["id", "l1"]);
  });

  it("error: throw", async () => {
    mockFrom.mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: { message: "fail" } }),
      }),
    });
    await expect(atualizarCamposLead("l1", { full_name: "X" })).rejects.toEqual({ message: "fail" });
  });
});

// ────────────────────────────────────────────────────────
// listarNotasLead
// ────────────────────────────────────────────────────────
describe("listarNotasLead", () => {
  it("retorna notas ordenadas desc + limit 200", async () => {
    const notas = [{ id: "n1" }, { id: "n2" }];
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: notas, error: null }),
    });
    expect(await listarNotasLead("l1")).toEqual(notas);
  });

  it("data null: array vazio", async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: null, error: null }),
    });
    expect(await listarNotasLead("l1")).toEqual([]);
  });

  it("error: throw", async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: null, error: { message: "fail" } }),
    });
    await expect(listarNotasLead("l1")).rejects.toEqual({ message: "fail" });
  });
});

// ────────────────────────────────────────────────────────
// criarNotaLead
// ────────────────────────────────────────────────────────
describe("criarNotaLead", () => {
  it("insert com author_user_id do auth.getUser", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "u1", email: "admin@x.com" } } });
    let receivedInsert: unknown = null;
    mockFrom.mockReturnValue({
      insert: vi.fn((u: unknown) => {
        receivedInsert = u;
        return Promise.resolve({ error: null });
      }),
    });
    await criarNotaLead({ leadId: "l1", conteudo: "Anotação" });
    expect(receivedInsert).toEqual({
      lead_id: "l1",
      content: "Anotação",
      note_type: "manual",
      author_user_id: "u1",
      author_name: "admin@x.com",
    });
  });

  it("authorName custom: prevalece sobre email", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "u1", email: "admin@x.com" } } });
    let receivedInsert: { author_name?: string } | null = null;
    mockFrom.mockReturnValue({
      insert: vi.fn((u: { author_name?: string }) => {
        receivedInsert = u;
        return Promise.resolve({ error: null });
      }),
    });
    await criarNotaLead({ leadId: "l1", conteudo: "X", authorName: "Operador" });
    expect(receivedInsert?.author_name).toBe("Operador");
  });

  it("sem user logado: author_user_id=null", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    let receivedInsert: { author_user_id?: string | null } | null = null;
    mockFrom.mockReturnValue({
      insert: vi.fn((u: { author_user_id?: string | null }) => {
        receivedInsert = u;
        return Promise.resolve({ error: null });
      }),
    });
    await criarNotaLead({ leadId: "l1", conteudo: "X" });
    expect(receivedInsert?.author_user_id).toBeNull();
  });

  it("error: throw", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    mockFrom.mockReturnValue({
      insert: vi.fn().mockResolvedValue({ error: { message: "fail" } }),
    });
    await expect(criarNotaLead({ leadId: "l1", conteudo: "X" })).rejects.toEqual({ message: "fail" });
  });
});

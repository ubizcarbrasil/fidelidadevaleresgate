/**
 * uploadPlanilhaParaStorage — sobe JSON pra Storage privado (workaround pra
 * iPhone PWA com payloads > 1MB que morrem no .invoke()).
 *
 * Bug aqui = sessão sem user_id permite upload anônimo (RLS bypass),
 * path sem userId quebra RLS, error não vira exceção tipada.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockGetSession, mockUpload } = vi.hoisted(() => ({
  mockGetSession: vi.fn(),
  mockUpload: vi.fn(),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: { getSession: mockGetSession },
    storage: {
      from: vi.fn(() => ({ upload: mockUpload })),
    },
  },
}));

import { uploadPlanilhaParaStorage } from "../upload_planilha_storage";
import { ImportacaoUploadError } from "../../types/tipos_importacao";

beforeEach(() => {
  mockGetSession.mockReset();
  mockUpload.mockReset();
});

describe("uploadPlanilhaParaStorage", () => {
  it("sem user_id: lança ImportacaoUploadError 'Sessão expirada'", async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });
    await expect(uploadPlanilhaParaStorage([{} as never]))
      .rejects.toBeInstanceOf(ImportacaoUploadError);
    await expect(uploadPlanilhaParaStorage([{} as never]))
      .rejects.toThrow(/Sessão expirada/);
  });

  it("upload OK: retorna path no formato userId/linhas-TIMESTAMP-RAND.json", async () => {
    mockGetSession.mockResolvedValue({ data: { session: { user: { id: "u1" } } } });
    mockUpload.mockResolvedValue({ error: null });
    const path = await uploadPlanilhaParaStorage([{ cpf: "123" } as never]);
    expect(path).toMatch(/^u1\/linhas-\d+-[a-z0-9]+\.json$/);
  });

  it("upload error: lança ImportacaoUploadError com mensagem do storage", async () => {
    mockGetSession.mockResolvedValue({ data: { session: { user: { id: "u1" } } } });
    mockUpload.mockResolvedValue({ error: { message: "quota exceeded" } });
    await expect(uploadPlanilhaParaStorage([{} as never]))
      .rejects.toThrow(/quota exceeded/);
  });

  it("upload chamado com upsert=false (não sobrescreve)", async () => {
    mockGetSession.mockResolvedValue({ data: { session: { user: { id: "u1" } } } });
    mockUpload.mockResolvedValue({ error: null });
    await uploadPlanilhaParaStorage([{} as never]);
    expect(mockUpload.mock.calls[0][2]).toMatchObject({
      upsert: false,
      contentType: "application/json",
    });
  });

  it("payload: Blob com contentType application/json + size > 0", async () => {
    mockGetSession.mockResolvedValue({ data: { session: { user: { id: "u1" } } } });
    mockUpload.mockResolvedValue({ error: null });
    const linhas = [{ cpf: "1" }, { cpf: "2" }] as never;
    await uploadPlanilhaParaStorage(linhas);
    const blob = mockUpload.mock.calls[0][1] as Blob;
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe("application/json");
    expect(blob.size).toBeGreaterThan(0);
  });
});

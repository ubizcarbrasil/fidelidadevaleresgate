import { describe, it, expect, vi, beforeEach } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Testes de isolamento branch_id para os Prêmios da Artilharia.
 *
 * Como o jsdom não consegue executar RLS real do Postgres, dividimos a
 * verificação em duas frentes complementares:
 *
 *  1. Camada de aplicação: garantir que o serviço/RPC sempre usa o
 *     `season_id` (que carrega `brand_id` + `branch_id`) e nunca busca
 *     dados sem essa restrição.
 *
 *  2. Camada de banco: validar estaticamente que a migração que cria a
 *     tabela `campeonato_artilharia_window_prizes` aplica RLS e que as políticas
 *     amarram o acesso ao `branch_id` da `campeonato_seasons`.
 */

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    rpc: vi.fn(),
    from: vi.fn(),
  },
}));

import { supabase } from "@/integrations/supabase/client";
import { obterTopRiders } from "../services/servico_artilharia";

describe("Artilharia — isolamento branch_id (app layer)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("obterTopRiders chama o RPC driver_get_top_riders APENAS com o season_id solicitado", async () => {
    (supabase.rpc as any).mockResolvedValue({ data: [], error: null });

    await obterTopRiders("season-branch-A", "24h");

    expect(supabase.rpc).toHaveBeenCalledTimes(1);
    expect(supabase.rpc).toHaveBeenCalledWith("driver_get_top_riders", {
      p_season_id: "season-branch-A",
      p_window: "24h",
    });
  });

  it("não vaza dados de outra branch quando o RPC retorna vazio (cross-branch)", async () => {
    (supabase.rpc as any).mockResolvedValue({ data: [], error: null });

    const result = await obterTopRiders("season-branch-B", "7d");

    expect(result).toEqual([]);
    // Garantir que NÃO houve consulta direta à tabela (fallback indevido).
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it("propaga erro do RPC sem expor dados de outras branches", async () => {
    (supabase.rpc as any).mockResolvedValue({
      data: null,
      error: { message: "permission denied for season" },
    });

    await expect(obterTopRiders("season-x", "24h")).rejects.toBeTruthy();
    expect(supabase.from).not.toHaveBeenCalled();
  });
});

describe("Artilharia — isolamento branch_id (RLS policies)", () => {
  const migrationPath = resolve(
    __dirname,
    "../../../../supabase/migrations/20260512214018_88ebcdd8-215d-4973-be10-794afa4650e4.sql",
  );
  const sql = readFileSync(migrationPath, "utf8");

  it("habilita RLS na tabela campeonato_artilharia_window_prizes", () => {
    expect(sql).toMatch(
      /ALTER TABLE\s+public\.campeonato_artilharia_window_prizes\s+ENABLE ROW LEVEL SECURITY/i,
    );
  });

  it("a política de SELECT amarra branch_id do customer == branch_id da season", () => {
    expect(sql).toMatch(/c\.branch_id\s*=\s*s\.branch_id/);
    expect(sql).toMatch(/c\.brand_id\s*=\s*s\.brand_id/);
    expect(sql).toMatch(/artilharia_window_prizes_select/);
  });

  it("a política de escrita exige permissão admin via duelo_admin_can_manage(brand_id)", () => {
    expect(sql).toMatch(/artilharia_window_prizes_admin_write/);
    expect(sql).toMatch(/duelo_admin_can_manage\(s\.brand_id\)/);
  });

  it("o RPC driver_get_top_riders filtra rides por brand_id E branch_id da season", () => {
    expect(sql).toMatch(/mr\.brand_id\s*=\s*v_brand_id/);
    expect(sql).toMatch(/mr\.branch_id\s*=\s*v_branch_id/);
  });

  it("o RPC define has_prize=true APENAS quando window enabled E rank=1", () => {
    expect(sql).toMatch(
      /COALESCE\(v_window_enabled,\s*false\)\s*AND\s*r\.rank\s*=\s*1/,
    );
  });
});
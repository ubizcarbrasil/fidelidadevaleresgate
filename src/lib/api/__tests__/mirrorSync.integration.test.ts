import { describe, it, expect, beforeEach, vi } from "vitest";

// ─────────────────────────────────────────────────────────────────────────────
// Mock do cliente Supabase
// Cada chamada de `supabase.from(table)` retorna um query builder encadeável
// que registra a operação executada. Os testes inspecionam essas chamadas
// para validar o comportamento da camada de API.
// ─────────────────────────────────────────────────────────────────────────────

interface RegistroChamada {
  table: string;
  op: string;
  payload?: any;
  filtros: Array<{ method: string; args: any[] }>;
}

const chamadasRegistradas: RegistroChamada[] = [];
const respostasMockadas: Record<string, { data?: any; error?: any }> = {};
const invocacoesEdgeFunction: Array<{ name: string; body: any }> = [];

function criarBuilder(table: string, op: string, payload?: any) {
  const registro: RegistroChamada = { table, op, payload, filtros: [] };
  chamadasRegistradas.push(registro);

  const chave = `${table}:${op}`;
  const resposta = respostasMockadas[chave] || { data: null, error: null };

  const builder: any = {};
  const metodosFiltro = [
    "eq", "neq", "in", "is", "ilike", "gt", "gte", "lt", "lte",
    "order", "limit", "select",
  ];

  metodosFiltro.forEach((m) => {
    builder[m] = vi.fn((...args: any[]) => {
      registro.filtros.push({ method: m, args });
      return builder;
    });
  });

  builder.single = vi.fn(() => Promise.resolve(resposta));
  builder.maybeSingle = vi.fn(() => Promise.resolve(resposta));

  // Torna o builder thenable
  const promise = Promise.resolve(resposta);
  builder.then = promise.then.bind(promise);
  builder.catch = promise.catch.bind(promise);

  return builder;
}

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn((table: string) => {
      const proxy: any = {};
      ["select", "insert", "update", "delete", "upsert"].forEach((op) => {
        proxy[op] = vi.fn((payload?: any) => criarBuilder(table, op, payload));
      });
      return proxy;
    }),
    functions: {
      invoke: vi.fn(async (name: string, opts: any) => {
        invocacoesEdgeFunction.push({ name, body: opts?.body });
        return { data: { ok: true, source: name }, error: null };
      }),
    },
  },
}));

import {
  createConnector,
  updateConnector,
  deleteConnector,
  fetchAllSyncConfigs,
  fetchConnectorById,
  triggerMirrorSync,
} from "@/lib/api/mirrorSync";

const BRAND_ID = "brand-test-123";
const CONFIG_ID = "config-abc-456";

beforeEach(() => {
  chamadasRegistradas.length = 0;
  invocacoesEdgeFunction.length = 0;
  for (const k of Object.keys(respostasMockadas)) delete respostasMockadas[k];
});

describe("Espelhamento — Integração da camada de API", () => {
  describe("Criar conector", () => {
    it("deve inserir um novo conector com brand_id e source_type", async () => {
      respostasMockadas["mirror_sync_config:insert"] = {
        data: { id: CONFIG_ID },
        error: null,
      };

      const resultado = await createConnector(BRAND_ID, "divulga_link", {
        label: "Vitrine Principal",
        origin_url: "https://exemplo.com/vitrine",
        is_enabled: true,
        auto_sync_enabled: true,
      });

      expect(resultado).toEqual({ id: CONFIG_ID });

      const insercao = chamadasRegistradas.find(
        (c) => c.table === "mirror_sync_config" && c.op === "insert"
      );
      expect(insercao).toBeDefined();
      expect(insercao!.payload).toMatchObject({
        brand_id: BRAND_ID,
        source_type: "divulga_link",
        label: "Vitrine Principal",
        origin_url: "https://exemplo.com/vitrine",
        is_enabled: true,
      });
    });

    it("deve propagar erro quando a inserção falhar", async () => {
      respostasMockadas["mirror_sync_config:insert"] = {
        data: null,
        error: { message: "violação de unicidade" },
      };

      await expect(
        createConnector(BRAND_ID, "divulgador_inteligente", { label: "X" })
      ).rejects.toMatchObject({ message: "violação de unicidade" });
    });
  });

  describe("Ativar / atualizar conector", () => {
    it("deve atualizar campos do conector e setar updated_at", async () => {
      respostasMockadas["mirror_sync_config:update"] = { data: null, error: null };

      await updateConnector(CONFIG_ID, {
        is_enabled: true,
        label: "Vitrine Atualizada",
      });

      const update = chamadasRegistradas.find(
        (c) => c.table === "mirror_sync_config" && c.op === "update"
      );
      expect(update).toBeDefined();
      expect(update!.payload.is_enabled).toBe(true);
      expect(update!.payload.label).toBe("Vitrine Atualizada");
      expect(update!.payload.updated_at).toBeTypeOf("string");

      const filtroId = update!.filtros.find((f) => f.method === "eq");
      expect(filtroId).toBeDefined();
      expect(filtroId!.args).toEqual(["id", CONFIG_ID]);
    });

    it("deve permitir desativar um conector via is_enabled=false", async () => {
      respostasMockadas["mirror_sync_config:update"] = { data: null, error: null };

      await updateConnector(CONFIG_ID, { is_enabled: false });

      const update = chamadasRegistradas.find((c) => c.op === "update")!;
      expect(update.payload.is_enabled).toBe(false);
    });
  });

  describe("Listar e buscar conectores", () => {
    it("fetchAllSyncConfigs deve filtrar por brand_id", async () => {
      respostasMockadas["mirror_sync_config:select"] = {
        data: [
          { id: "c1", source_type: "divulga_link", brand_id: BRAND_ID },
          { id: "c2", source_type: "divulgador_inteligente", brand_id: BRAND_ID },
        ],
        error: null,
      };

      const lista = await fetchAllSyncConfigs(BRAND_ID);
      expect(lista).toHaveLength(2);

      const select = chamadasRegistradas.find(
        (c) => c.table === "mirror_sync_config" && c.op === "select"
      )!;
      const filtroBrand = select.filtros.find(
        (f) => f.method === "eq" && f.args[0] === "brand_id"
      );
      expect(filtroBrand?.args[1]).toBe(BRAND_ID);
    });

    it("fetchConnectorById deve buscar pelo id do conector", async () => {
      respostasMockadas["mirror_sync_config:select"] = {
        data: { id: CONFIG_ID, source_type: "divulga_link" },
        error: null,
      };

      const conector = await fetchConnectorById(CONFIG_ID);
      expect(conector).toMatchObject({ id: CONFIG_ID });

      const select = chamadasRegistradas.find((c) => c.op === "select")!;
      const filtroId = select.filtros.find(
        (f) => f.method === "eq" && f.args[0] === "id"
      );
      expect(filtroId?.args[1]).toBe(CONFIG_ID);
    });
  });

  describe("Sincronizar por config_id", () => {
    it("triggerMirrorSync deve invocar a edge function passando config_id", async () => {
      const resultado = await triggerMirrorSync(
        BRAND_ID,
        "divulga_link",
        CONFIG_ID
      );

      expect(resultado).toMatchObject({ ok: true });
      expect(invocacoesEdgeFunction).toHaveLength(1);
      expect(invocacoesEdgeFunction[0].name).toBe("mirror-sync");
      expect(invocacoesEdgeFunction[0].body).toEqual({
        brand_id: BRAND_ID,
        source_type: "divulga_link",
        config_id: CONFIG_ID,
      });
    });

    it("triggerMirrorSync sem config_id deve enviar config_id=undefined (modo legado/iteração total)", async () => {
      await triggerMirrorSync(BRAND_ID, "divulgador_inteligente");

      expect(invocacoesEdgeFunction[0].body).toEqual({
        brand_id: BRAND_ID,
        source_type: "divulgador_inteligente",
        config_id: undefined,
      });
    });
  });

  describe("Fluxo completo: criar → ativar → sincronizar", () => {
    it("deve executar a sequência criar conector → ativar → sincronizar por config_id", async () => {
      // 1. Criar
      respostasMockadas["mirror_sync_config:insert"] = {
        data: { id: CONFIG_ID },
        error: null,
      };
      const criado = await createConnector(BRAND_ID, "divulga_link", {
        label: "Conector E2E",
        origin_url: "https://exemplo.com/grupo-1",
        is_enabled: false,
      });
      expect(criado.id).toBe(CONFIG_ID);

      // 2. Ativar
      respostasMockadas["mirror_sync_config:update"] = { data: null, error: null };
      await updateConnector(criado.id, { is_enabled: true });

      // 3. Sincronizar
      const sync = await triggerMirrorSync(
        BRAND_ID,
        "divulga_link",
        criado.id
      );
      expect(sync).toMatchObject({ ok: true });

      // Verificações da sequência
      const ops = chamadasRegistradas
        .filter((c) => c.table === "mirror_sync_config")
        .map((c) => c.op);
      expect(ops).toEqual(["insert", "update"]);

      expect(invocacoesEdgeFunction[0].body.config_id).toBe(CONFIG_ID);
    });
  });

  describe("Excluir conector", () => {
    it("deleteConnector deve remover pelo id", async () => {
      respostasMockadas["mirror_sync_config:delete"] = { data: null, error: null };

      await deleteConnector(CONFIG_ID);

      const del = chamadasRegistradas.find(
        (c) => c.table === "mirror_sync_config" && c.op === "delete"
      );
      expect(del).toBeDefined();
      const filtroId = del!.filtros.find(
        (f) => f.method === "eq" && f.args[0] === "id"
      );
      expect(filtroId?.args[1]).toBe(CONFIG_ID);
    });

    it("deleteConnector com archiveDeals=true deve arquivar deals da origem antes de excluir", async () => {
      respostasMockadas["affiliate_deals:update"] = { data: null, error: null };
      respostasMockadas["mirror_sync_config:delete"] = { data: null, error: null };

      await deleteConnector(CONFIG_ID, {
        archiveDeals: true,
        brandId: BRAND_ID,
        sourceType: "divulga_link",
      });

      const arquivamento = chamadasRegistradas.find(
        (c) => c.table === "affiliate_deals" && c.op === "update"
      );
      expect(arquivamento).toBeDefined();
      expect(arquivamento!.payload).toMatchObject({
        current_status: "archived",
        is_active: false,
      });
    });
  });
});

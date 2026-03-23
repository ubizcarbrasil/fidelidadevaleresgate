import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Content-Type": "application/json",
};

const TOOLS = [
  {
    name: "list_tables",
    description: "Lista todas as tabelas do schema public",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "query_records",
    description: "Busca registros de uma tabela com filtros e limite opcionais",
    inputSchema: {
      type: "object",
      required: ["table"],
      properties: {
        table: { type: "string", description: "Nome da tabela" },
        filters: { type: "object", description: "Filtros key=value" },
        limit: { type: "number", description: "Máximo de registros (padrão 100)" },
        offset: { type: "number", description: "Offset para paginação" },
        order_by: { type: "string", description: "Campo para ordenar" },
      },
    },
  },
  {
    name: "create_record",
    description: "Cria um novo registro em uma tabela",
    inputSchema: {
      type: "object",
      required: ["table", "data"],
      properties: {
        table: { type: "string" },
        data: { type: "object", description: "Dados do novo registro" },
      },
    },
  },
  {
    name: "update_record",
    description: "Atualiza um registro pelo ID",
    inputSchema: {
      type: "object",
      required: ["table", "id", "data"],
      properties: {
        table: { type: "string" },
        id: { type: "string", description: "UUID do registro" },
        data: { type: "object", description: "Campos a atualizar" },
      },
    },
  },
  {
    name: "delete_record",
    description: "Deleta um registro pelo ID",
    inputSchema: {
      type: "object",
      required: ["table", "id"],
      properties: {
        table: { type: "string" },
        id: { type: "string" },
      },
    },
  },
  {
    name: "get_schema",
    description: "Retorna o schema de uma tabela (colunas e tipos)",
    inputSchema: {
      type: "object",
      required: ["table"],
      properties: {
        table: { type: "string" },
      },
    },
  },
];

async function authenticateRequest(req: Request, supabaseUrl: string, supabaseServiceKey: string): Promise<boolean> {
  const authHeader = req.headers.get("Authorization") ?? "";

  // Check AGENT_SECRET
  const agentSecret = Deno.env.get("AGENT_SECRET");
  if (agentSecret && authHeader === `Bearer ${agentSecret}`) {
    return true;
  }

  // Check Supabase anon key (from supabase.functions.invoke)
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (anonKey && authHeader === `Bearer ${anonKey}`) {
    // When called via supabase.functions.invoke, the anon key is sent as auth header
    // We need to check the actual user from the x-client-info or use the supabase client
    // Accept anon key calls but use service role for operations
    return true;
  }

  // Check JWT via supabase
  if (authHeader.startsWith("Bearer ")) {
    try {
      const token = authHeader.replace("Bearer ", "");
      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
      const { data, error } = await supabaseAdmin.auth.getUser(token);
      if (!error && data?.user) {
        return true;
      }
    } catch {
      // fall through
    }
  }

  return false;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const isAuth = await authenticateRequest(req, supabaseUrl, supabaseServiceKey);
  if (!isAuth) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: corsHeaders,
    });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const body = await req.json();

  const respond = (result: unknown) =>
    new Response(JSON.stringify({ jsonrpc: "2.0", id: body.id, result }), { headers: corsHeaders });
  const respondError = (msg: string) =>
    new Response(
      JSON.stringify({
        jsonrpc: "2.0",
        id: body.id,
        result: { content: [{ type: "text", text: `Erro: ${msg}` }], isError: true },
      }),
      { headers: corsHeaders }
    );

  // initialize
  if (body.method === "initialize") {
    return respond({
      protocolVersion: "2024-11-05",
      capabilities: { tools: {} },
      serverInfo: { name: "lovable-control-panel", version: "1.0.0" },
    });
  }

  // notifications
  if (body.method?.startsWith("notifications/")) {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  // tools/list
  if (body.method === "tools/list") {
    return respond({ tools: TOOLS });
  }

  // tools/call
  if (body.method === "tools/call") {
    const { name, arguments: args } = body.params;

    try {
      let result: unknown;

      switch (name) {
        case "list_tables": {
          const { data, error } = await supabase
            .from("information_schema.tables" as any)
            .select("table_name")
            .eq("table_schema", "public")
            .eq("table_type", "BASE TABLE");
          if (error) {
            // Fallback: query pg_tables
            const { data: pgData, error: pgError } = await supabase.rpc("get_public_tables" as any);
            if (pgError) throw pgError;
            result = { tables: pgData ?? [] };
          } else {
            result = { tables: (data ?? []).map((t: any) => t.table_name) };
          }
          break;
        }

        case "query_records": {
          let q = supabase.from(args.table).select("*", { count: "exact" });
          if (args.filters) {
            for (const [k, v] of Object.entries(args.filters)) {
              q = q.eq(k, v as string);
            }
          }
          if (args.order_by) q = q.order(args.order_by, { ascending: false });
          else q = q.order("created_at", { ascending: false });
          if (args.offset) q = q.range(args.offset, args.offset + (args.limit ?? 100) - 1);
          else q = q.limit(args.limit ?? 100);
          const { data, error, count } = await q;
          if (error) throw error;
          result = { records: data, count: count ?? data?.length ?? 0 };
          break;
        }

        case "create_record": {
          const { data, error } = await supabase
            .from(args.table)
            .insert(args.data)
            .select()
            .single();
          if (error) throw error;
          result = { created: data };
          break;
        }

        case "update_record": {
          const { data, error } = await supabase
            .from(args.table)
            .update(args.data)
            .eq("id", args.id)
            .select()
            .single();
          if (error) throw error;
          result = { updated: data };
          break;
        }

        case "delete_record": {
          const { error } = await supabase.from(args.table).delete().eq("id", args.id);
          if (error) throw error;
          result = { deleted: true, id: args.id };
          break;
        }

        case "get_schema": {
          const { data, error } = await supabase
            .from("information_schema.columns" as any)
            .select("column_name, data_type, is_nullable, column_default")
            .eq("table_schema", "public")
            .eq("table_name", args.table)
            .order("ordinal_position" as any);
          if (error) throw error;
          result = { table: args.table, columns: data };
          break;
        }

        default:
          throw new Error(`Ferramenta desconhecida: ${name}`);
      }

      return respond({
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      });
    } catch (err: any) {
      return respondError(err.message);
    }
  }

  return new Response(JSON.stringify({ error: "Method not found" }), {
    status: 404,
    headers: corsHeaders,
  });
});

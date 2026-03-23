import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Database,
  Table2,
  Plus,
  Pencil,
  Trash2,
  X,
  Loader2,
  Search,
  ChevronLeft,
  ChevronRight,
  Server,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

/* ─── types ─── */
interface ColumnSchema {
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default: string | null;
}

/* ─── MCP RPC helper ─── */
async function mcpCall(method: string, params: Record<string, unknown> = {}) {
  const { data, error } = await supabase.functions.invoke("mcp-server", {
    body: { jsonrpc: "2.0", id: Date.now(), method, params },
  });
  if (error) throw new Error(error.message);
  if (data?.result?.isError) throw new Error(data.result.content?.[0]?.text ?? "Erro");
  return data?.result;
}

async function mcpTool(name: string, args: Record<string, unknown> = {}) {
  const res = await mcpCall("tools/call", { name, arguments: args });
  const text = res?.content?.[0]?.text;
  return text ? JSON.parse(text) : res;
}

/* ─── JSON syntax highlight ─── */
function highlightJson(json: string): string {
  return json
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(
      /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\\-]?\d+)?)/g,
      (match) => {
        let cls = "text-orange-400";
        if (/^"/.test(match)) {
          cls = /:$/.test(match) ? "text-sky-400" : "text-emerald-400";
        } else if (/true|false/.test(match)) {
          cls = "text-purple-400";
        } else if (/null/.test(match)) {
          cls = "text-gray-500";
        }
        return `<span class="${cls}">${match}</span>`;
      }
    );
}

const PAGE_SIZE = 50;

export default function McpDashboardPage() {
  const [tables, setTables] = useState<string[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [columns, setColumns] = useState<ColumnSchema[]>([]);
  const [records, setRecords] = useState<Record<string, unknown>[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingTables, setLoadingTables] = useState(true);

  const [panelOpen, setPanelOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Record<string, unknown> | null>(null);
  const [formValues, setFormValues] = useState<Record<string, unknown>>({});
  const [saving, setSaving] = useState(false);

  const [showMcpTools, setShowMcpTools] = useState(false);
  const [mcpToolName, setMcpToolName] = useState("");
  const [mcpToolArgs, setMcpToolArgs] = useState("{}");
  const [mcpResult, setMcpResult] = useState<string | null>(null);
  const [mcpRunning, setMcpRunning] = useState(false);

  const loadTables = useCallback(async () => {
    setLoadingTables(true);
    try {
      const res = await mcpTool("list_tables");
      setTables(res.tables ?? []);
    } catch {
      setTables(["cp_contacts", "cp_tasks", "cp_notes"]);
    }
    setLoadingTables(false);
  }, []);

  useEffect(() => { loadTables(); }, [loadTables]);

  const loadSchema = useCallback(async (table: string) => {
    try {
      const res = await mcpTool("get_schema", { table });
      setColumns(res.columns ?? []);
    } catch {
      setColumns([]);
    }
  }, []);

  const loadRecords = useCallback(async (table: string, pg: number) => {
    setLoading(true);
    try {
      const res = await mcpTool("query_records", {
        table,
        limit: PAGE_SIZE,
        offset: pg * PAGE_SIZE,
      });
      setRecords(res.records ?? []);
      setTotalCount(res.count ?? 0);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Erro desconhecido";
      toast.error("Erro ao carregar registros: " + msg);
      setRecords([]);
    }
    setLoading(false);
  }, []);

  const selectTable = useCallback(
    (table: string) => {
      setSelectedTable(table);
      setPage(0);
      setSearch("");
      setPanelOpen(false);
      setShowMcpTools(false);
      loadSchema(table);
      loadRecords(table, 0);
    },
    [loadSchema, loadRecords]
  );

  useEffect(() => {
    if (selectedTable) loadRecords(selectedTable, page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const editableColumns = columns.filter(
    (c) => c.column_name !== "id" && c.column_name !== "created_at"
  );

  const openCreate = () => {
    setEditingRecord(null);
    const defaults: Record<string, unknown> = {};
    editableColumns.forEach((c) => {
      if (c.data_type === "boolean") defaults[c.column_name] = false;
      else if (c.data_type === "ARRAY") defaults[c.column_name] = "";
      else defaults[c.column_name] = "";
    });
    setFormValues(defaults);
    setPanelOpen(true);
  };

  const openEdit = (record: Record<string, unknown>) => {
    setEditingRecord(record);
    const vals: Record<string, unknown> = {};
    editableColumns.forEach((c) => {
      const v = record[c.column_name];
      if (Array.isArray(v)) vals[c.column_name] = v.join(", ");
      else vals[c.column_name] = v ?? "";
    });
    setFormValues(vals);
    setPanelOpen(true);
  };

  const handleSave = async () => {
    if (!selectedTable) return;
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {};
      editableColumns.forEach((c) => {
        const v = formValues[c.column_name];
        if (c.data_type === "ARRAY" && typeof v === "string") {
          payload[c.column_name] = v.split(",").map((s: string) => s.trim()).filter(Boolean);
        } else if (["integer", "numeric", "bigint", "double precision", "smallint", "real"].includes(c.data_type)) {
          payload[c.column_name] = v === "" ? null : Number(v);
        } else if (c.data_type === "boolean") {
          payload[c.column_name] = Boolean(v);
        } else {
          payload[c.column_name] = v === "" ? null : v;
        }
      });

      if (editingRecord) {
        await mcpTool("update_record", { table: selectedTable, id: editingRecord.id as string, data: payload });
        toast.success("Registro atualizado");
      } else {
        await mcpTool("create_record", { table: selectedTable, data: payload });
        toast.success("Registro criado");
      }
      setPanelOpen(false);
      loadRecords(selectedTable, page);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Erro desconhecido";
      toast.error("Erro: " + msg);
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!selectedTable || !confirm("Excluir este registro?")) return;
    try {
      await mcpTool("delete_record", { table: selectedTable, id });
      toast.success("Registro excluído");
      loadRecords(selectedTable, page);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Erro desconhecido";
      toast.error("Erro: " + msg);
    }
  };

  const runMcpTool = async () => {
    setMcpRunning(true);
    setMcpResult(null);
    try {
      const args = JSON.parse(mcpToolArgs);
      const res = await mcpTool(mcpToolName, args);
      setMcpResult(JSON.stringify(res, null, 2));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Erro desconhecido";
      setMcpResult(`Erro: ${msg}`);
    }
    setMcpRunning(false);
  };

  const filteredRecords = search
    ? records.filter((r) =>
        Object.values(r).some((v) =>
          String(v ?? "").toLowerCase().includes(search.toLowerCase())
        )
      )
    : records;

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const visibleColumns = columns.slice(0, 6);

  return (
    <div className="flex h-screen bg-[#0f172a] text-white overflow-hidden">
      {/* SIDEBAR */}
      <aside className="w-60 flex-shrink-0 border-r border-white/10 flex flex-col bg-[#0f172a]">
        <div className="p-4 border-b border-white/10 flex items-center gap-2">
          <Server className="h-5 w-5 text-sky-400" />
          <span className="font-semibold text-sm">Control Panel</span>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2">
            <p className="px-2 py-1 text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Tabelas</p>
            {loadingTables ? (
              <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-gray-500" /></div>
            ) : (
              tables.map((t) => (
                <button
                  key={t}
                  onClick={() => selectTable(t)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm flex items-center gap-2 transition-colors ${
                    selectedTable === t ? "bg-sky-500/20 text-sky-300" : "text-gray-400 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Table2 className="h-3.5 w-3.5 flex-shrink-0" />
                  <span className="truncate">{t}</span>
                </button>
              ))
            )}
          </div>
          <div className="p-2 border-t border-white/10 mt-2">
            <p className="px-2 py-1 text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Ferramentas MCP</p>
            <button
              onClick={() => { setShowMcpTools(true); setSelectedTable(null); setPanelOpen(false); }}
              className={`w-full text-left px-3 py-2 rounded-md text-sm flex items-center gap-2 transition-colors ${
                showMcpTools ? "bg-emerald-500/20 text-emerald-300" : "text-gray-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Database className="h-3.5 w-3.5" />
              <span>Testar Ferramentas</span>
            </button>
          </div>
        </ScrollArea>
      </aside>

      {/* MAIN */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {!selectedTable && !showMcpTools ? (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <Database className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Selecione uma tabela na sidebar</p>
            </div>
          </div>
        ) : showMcpTools ? (
          <div className="flex-1 flex flex-col p-6 overflow-auto">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Database className="h-5 w-5 text-emerald-400" />
              Testar Ferramentas MCP
            </h2>
            <div className="max-w-2xl space-y-4">
              <div>
                <Label className="text-gray-400 text-xs">Nome da ferramenta</Label>
                <Input className="bg-[#1e293b] border-white/10 text-white mt-1" placeholder="ex: list_tables, query_records, get_schema" value={mcpToolName} onChange={(e) => setMcpToolName(e.target.value)} />
              </div>
              <div>
                <Label className="text-gray-400 text-xs">Argumentos (JSON)</Label>
                <textarea className="w-full mt-1 bg-[#1e293b] border border-white/10 rounded-md p-3 text-sm text-white font-mono min-h-[120px] focus:outline-none focus:ring-2 focus:ring-sky-500" value={mcpToolArgs} onChange={(e) => setMcpToolArgs(e.target.value)} />
              </div>
              <Button onClick={runMcpTool} disabled={!mcpToolName || mcpRunning} className="bg-emerald-600 hover:bg-emerald-700">
                {mcpRunning && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Executar
              </Button>
              {mcpResult && (
                <div className="mt-4">
                  <Label className="text-gray-400 text-xs">Resultado</Label>
                  <pre className="mt-1 bg-[#0c1222] border border-white/10 rounded-md p-4 text-xs font-mono overflow-auto max-h-[400px]" dangerouslySetInnerHTML={{ __html: highlightJson(mcpResult) }} />
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Table header */}
            <div className="p-4 border-b border-white/10 flex flex-wrap items-center gap-3">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Table2 className="h-5 w-5 text-sky-400" />
                {selectedTable}
              </h2>
              <Badge variant="outline" className="border-white/20 text-gray-400 text-xs">{totalCount} registros</Badge>
              <div className="flex-1" />
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input className="bg-[#1e293b] border-white/10 text-white pl-9 text-sm" placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <Button size="sm" variant="ghost" className="text-gray-400 hover:text-white" onClick={() => selectedTable && loadRecords(selectedTable, page)}>
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button size="sm" className="bg-sky-600 hover:bg-sky-700" onClick={openCreate}>
                <Plus className="h-4 w-4 mr-1" /> Novo
              </Button>
            </div>

            {/* Table body */}
            <div className="flex-1 overflow-auto">
              {loading ? (
                <div className="flex justify-center items-center h-40"><Loader2 className="h-6 w-6 animate-spin text-gray-500" /></div>
              ) : filteredRecords.length === 0 ? (
                <div className="flex justify-center items-center h-40 text-gray-500 text-sm">Nenhum registro encontrado</div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-gray-400 text-xs uppercase">
                      {visibleColumns.map((c) => (
                        <th key={c.column_name} className="px-4 py-3 text-left font-medium">{c.column_name}</th>
                      ))}
                      <th className="px-4 py-3 text-right font-medium w-24">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecords.map((record, i) => (
                      <tr key={(record.id as string) ?? i} className="border-b border-white/5 hover:bg-white/[0.03] transition-colors">
                        {visibleColumns.map((c) => {
                          const v = record[c.column_name];
                          const display = Array.isArray(v) ? v.join(", ") : v === null || v === undefined ? "—" : String(v);
                          return (
                            <td key={c.column_name} className="px-4 py-3 text-gray-300 max-w-[200px] truncate" title={display}>
                              {display.length > 60 ? display.slice(0, 60) + "…" : display}
                            </td>
                          );
                        })}
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => openEdit(record)} className="p-1.5 rounded hover:bg-white/10 text-gray-400 hover:text-sky-400 transition-colors">
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={() => handleDelete(record.id as string)} className="p-1.5 rounded hover:bg-white/10 text-gray-400 hover:text-red-400 transition-colors">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination */}
            <div className="p-3 border-t border-white/10 flex items-center justify-between text-xs text-gray-500">
              <span>Página {page + 1} de {totalPages}</span>
              <div className="flex items-center gap-1">
                <Button size="icon" variant="ghost" className="h-7 w-7 text-gray-400" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7 text-gray-400" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}

        {/* SLIDE-IN PANEL */}
        <div className={`absolute top-0 right-0 h-full w-[380px] bg-[#1e293b] border-l border-white/10 shadow-2xl transition-transform duration-300 flex flex-col z-50 ${panelOpen ? "translate-x-0" : "translate-x-full"}`}>
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <h3 className="font-semibold text-sm">{editingRecord ? "Editar Registro" : "Novo Registro"}</h3>
            <button onClick={() => setPanelOpen(false)} className="p-1 rounded hover:bg-white/10 text-gray-400"><X className="h-4 w-4" /></button>
          </div>
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {editableColumns.map((col) => {
                const isOptional = col.is_nullable === "YES";
                const key = col.column_name;
                const value = formValues[key];

                if (col.data_type === "boolean") {
                  return (
                    <div key={key} className="flex items-center justify-between">
                      <Label className="text-gray-400 text-xs">{key} {isOptional && <span className="text-gray-600">(opcional)</span>}</Label>
                      <Switch checked={Boolean(value)} onCheckedChange={(v) => setFormValues((prev) => ({ ...prev, [key]: v }))} />
                    </div>
                  );
                }

                const isNumber = ["integer", "numeric", "bigint", "double precision", "smallint", "real"].includes(col.data_type);
                const isDate = col.data_type === "date";
                const isTextArea = col.data_type === "text" && (key.includes("content") || key.includes("description") || key.includes("notes") || key.includes("body"));

                return (
                  <div key={key}>
                    <Label className="text-gray-400 text-xs">
                      {key} {isOptional && <span className="text-gray-600">(opcional)</span>}
                      {col.data_type === "ARRAY" && <span className="text-gray-600 ml-1">(separar por vírgula)</span>}
                    </Label>
                    {isTextArea ? (
                      <textarea
                        className="w-full mt-1 bg-[#0f172a] border border-white/10 rounded-md p-2.5 text-sm text-white min-h-[80px] focus:outline-none focus:ring-2 focus:ring-sky-500"
                        value={String(value ?? "")}
                        onChange={(e) => setFormValues((prev) => ({ ...prev, [key]: e.target.value }))}
                      />
                    ) : (
                      <Input
                        className="bg-[#0f172a] border-white/10 text-white mt-1"
                        type={isNumber ? "number" : isDate ? "date" : "text"}
                        value={String(value ?? "")}
                        onChange={(e) => setFormValues((prev) => ({ ...prev, [key]: e.target.value }))}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
          <div className="p-4 border-t border-white/10">
            <Button className="w-full bg-sky-600 hover:bg-sky-700" onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {editingRecord ? "Atualizar" : "Criar"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

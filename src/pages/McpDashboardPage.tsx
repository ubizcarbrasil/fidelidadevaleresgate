import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Loader2, X, Play, Server, ChevronRight } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
interface ParamSchema {
  type: "string" | "number" | "boolean";
  description?: string;
  default?: unknown;
}

interface ToolInputSchema {
  type: "object";
  required?: string[];
  properties: Record<string, ParamSchema>;
}

interface McpTool {
  name: string;
  description: string;
  inputSchema: ToolInputSchema;
  mockResponse: Record<string, unknown>;
}

interface McpServer {
  id: string;
  name: string;
  status: "connected" | "disconnected";
  tools: McpTool[];
}

/* ------------------------------------------------------------------ */
/*  Mock data                                                          */
/* ------------------------------------------------------------------ */
const MOCK_SERVERS: McpServer[] = [
  {
    id: "supabase",
    name: "Supabase MCP",
    status: "connected",
    tools: [
      {
        name: "list_tables",
        description: "List all tables in the public schema with row counts.",
        inputSchema: {
          type: "object",
          required: ["schema"],
          properties: {
            schema: { type: "string", description: "Database schema name", default: "public" },
            include_views: { type: "boolean", description: "Include views in results" },
          },
        },
        mockResponse: {
          tables: [
            { name: "users", row_count: 1284 },
            { name: "orders", row_count: 8472 },
            { name: "products", row_count: 356 },
          ],
        },
      },
      {
        name: "run_query",
        description: "Execute a read-only SQL query against the database.",
        inputSchema: {
          type: "object",
          required: ["sql"],
          properties: {
            sql: { type: "string", description: "SQL query to execute" },
            limit: { type: "number", description: "Max rows to return" },
          },
        },
        mockResponse: { rows: [{ id: 1, email: "user@example.com" }], row_count: 1 },
      },
      {
        name: "create_migration",
        description: "Generate a new database migration file.",
        inputSchema: {
          type: "object",
          required: ["name", "sql"],
          properties: {
            name: { type: "string", description: "Migration name" },
            sql: { type: "string", description: "SQL statements" },
            dry_run: { type: "boolean", description: "Preview without applying" },
          },
        },
        mockResponse: { migration_id: "20260323_add_column", status: "created", applied: false },
      },
    ],
  },
  {
    id: "github",
    name: "GitHub MCP",
    status: "connected",
    tools: [
      {
        name: "list_repos",
        description: "List repositories for the authenticated user or organization.",
        inputSchema: {
          type: "object",
          properties: {
            org: { type: "string", description: "Organization name (optional)" },
            limit: { type: "number", description: "Max repos to return" },
            include_private: { type: "boolean", description: "Include private repos" },
          },
        },
        mockResponse: {
          repos: [
            { name: "frontend-app", stars: 142, language: "TypeScript" },
            { name: "api-server", stars: 87, language: "Go" },
          ],
        },
      },
      {
        name: "create_issue",
        description: "Create a new issue in a repository.",
        inputSchema: {
          type: "object",
          required: ["repo", "title"],
          properties: {
            repo: { type: "string", description: "Repository name (owner/repo)" },
            title: { type: "string", description: "Issue title" },
            body: { type: "string", description: "Issue body in Markdown" },
          },
        },
        mockResponse: { issue_number: 47, url: "https://github.com/acme/app/issues/47", state: "open" },
      },
      {
        name: "get_pull_request",
        description: "Fetch details of a pull request.",
        inputSchema: {
          type: "object",
          required: ["repo", "pr_number"],
          properties: {
            repo: { type: "string", description: "Repository name (owner/repo)" },
            pr_number: { type: "number", description: "Pull request number" },
          },
        },
        mockResponse: {
          title: "feat: add dark mode",
          state: "open",
          additions: 342,
          deletions: 28,
          mergeable: true,
        },
      },
      {
        name: "search_code",
        description: "Search for code across repositories.",
        inputSchema: {
          type: "object",
          required: ["query"],
          properties: {
            query: { type: "string", description: "Search query" },
            language: { type: "string", description: "Filter by language" },
          },
        },
        mockResponse: {
          total_count: 3,
          items: [
            { path: "src/utils.ts", repository: "acme/app", score: 0.95 },
          ],
        },
      },
    ],
  },
  {
    id: "notion",
    name: "Notion MCP",
    status: "disconnected",
    tools: [
      {
        name: "search_pages",
        description: "Search for pages and databases in the workspace.",
        inputSchema: {
          type: "object",
          required: ["query"],
          properties: {
            query: { type: "string", description: "Search query" },
            limit: { type: "number", description: "Max results" },
          },
        },
        mockResponse: {
          results: [
            { id: "page-1", title: "Product Roadmap", type: "page" },
            { id: "db-1", title: "Tasks", type: "database" },
          ],
        },
      },
      {
        name: "read_page",
        description: "Read the content of a Notion page.",
        inputSchema: {
          type: "object",
          required: ["page_id"],
          properties: {
            page_id: { type: "string", description: "Notion page ID" },
            include_children: { type: "boolean", description: "Include child blocks" },
          },
        },
        mockResponse: {
          id: "page-1",
          title: "Product Roadmap",
          content: "## Q1 Goals\n- Launch v2.0\n- Onboard 50 customers",
          last_edited: "2026-03-20T14:30:00Z",
        },
      },
      {
        name: "create_page",
        description: "Create a new page in a Notion database.",
        inputSchema: {
          type: "object",
          required: ["database_id", "title"],
          properties: {
            database_id: { type: "string", description: "Parent database ID" },
            title: { type: "string", description: "Page title" },
            content: { type: "string", description: "Page content in Markdown" },
          },
        },
        mockResponse: { id: "page-new", title: "New Page", url: "https://notion.so/page-new" },
      },
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  JSON syntax highlighter                                            */
/* ------------------------------------------------------------------ */
function highlightJson(json: string): string {
  return json
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"([^"]+)"(?=\s*:)/g, '<span class="text-blue-400">"$1"</span>')
    .replace(/:\s*"([^"]*)"/g, ': <span class="text-emerald-400">"$1"</span>')
    .replace(/:\s*(\d+\.?\d*)/g, ': <span class="text-orange-400">$1</span>')
    .replace(/:\s*(true|false)/g, ': <span class="text-purple-400">$1</span>')
    .replace(/:\s*(null)/g, ': <span class="text-gray-500">$1</span>');
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function ServerListItem({
  server,
  selected,
  onSelect,
}: {
  server: McpServer;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors text-sm ${
        selected
          ? "bg-[#334155] text-white"
          : "text-slate-300 hover:bg-[#1e293b]"
      }`}
    >
      <span
        className={`h-2.5 w-2.5 rounded-full shrink-0 ${
          server.status === "connected" ? "bg-emerald-400" : "bg-gray-500"
        }`}
      />
      <Server className="h-4 w-4 shrink-0 text-slate-400" />
      <span className="truncate font-medium">{server.name}</span>
      {selected && <ChevronRight className="h-4 w-4 ml-auto text-slate-400" />}
    </button>
  );
}

function ToolCard({
  tool,
  onRun,
}: {
  tool: McpTool;
  onRun: () => void;
}) {
  const paramCount = Object.keys(tool.inputSchema.properties).length;
  return (
    <div className="bg-[#1e293b] border border-slate-700/50 rounded-xl p-5 flex flex-col gap-3 hover:-translate-y-0.5 transition-transform">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-white font-semibold text-base font-mono">{tool.name}</h3>
        <Badge variant="outline" className="border-slate-600 text-slate-400 text-xs shrink-0">
          {paramCount} param{paramCount !== 1 ? "s" : ""}
        </Badge>
      </div>
      <p className="text-slate-400 text-sm leading-relaxed flex-1">{tool.description}</p>
      <Button
        size="sm"
        onClick={onRun}
        className="w-full bg-blue-600 hover:bg-blue-500 text-white mt-1"
      >
        <Play className="h-3.5 w-3.5 mr-1.5" />
        Run
      </Button>
    </div>
  );
}

function DynamicForm({
  schema,
  values,
  onChange,
}: {
  schema: ToolInputSchema;
  values: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
}) {
  const required = new Set(schema.required ?? []);

  return (
    <div className="flex flex-col gap-4">
      {Object.entries(schema.properties).map(([key, param]) => {
        const isRequired = required.has(key);
        return (
          <div key={key} className="flex flex-col gap-1.5">
            <Label className="text-slate-300 text-sm flex items-center gap-2">
              <span className="font-mono">{key}</span>
              {!isRequired && (
                <span className="text-[10px] text-slate-500 uppercase tracking-wider">optional</span>
              )}
            </Label>
            {param.description && (
              <span className="text-xs text-slate-500">{param.description}</span>
            )}
            {param.type === "boolean" ? (
              <div className="flex items-center gap-2 pt-1">
                <Switch
                  checked={Boolean(values[key])}
                  onCheckedChange={(v) => onChange(key, v)}
                />
                <span className="text-xs text-slate-400">
                  {values[key] ? "true" : "false"}
                </span>
              </div>
            ) : param.type === "number" ? (
              <Input
                type="number"
                value={values[key] !== undefined ? String(values[key]) : ""}
                onChange={(e) => onChange(key, e.target.value ? Number(e.target.value) : undefined)}
                placeholder={param.default !== undefined ? String(param.default) : ""}
                className="bg-[#0f172a] border-slate-700 text-white placeholder:text-slate-600"
              />
            ) : (
              <Input
                type="text"
                value={values[key] !== undefined ? String(values[key]) : ""}
                onChange={(e) => onChange(key, e.target.value || undefined)}
                placeholder={param.default !== undefined ? String(param.default) : ""}
                className="bg-[#0f172a] border-slate-700 text-white placeholder:text-slate-600"
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function OutputPanel({ data }: { data: Record<string, unknown> }) {
  const formatted = JSON.stringify(data, null, 2);
  return (
    <div className="bg-[#0f172a] border border-slate-700/50 rounded-lg p-4 overflow-x-auto">
      <pre
        className="text-sm font-mono leading-relaxed whitespace-pre-wrap break-words text-slate-300"
        dangerouslySetInnerHTML={{ __html: highlightJson(formatted) }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main page                                                          */
/* ------------------------------------------------------------------ */
export default function McpDashboardPage() {
  const [selectedServerId, setSelectedServerId] = useState(MOCK_SERVERS[0].id);
  const [activeTool, setActiveTool] = useState<McpTool | null>(null);
  const [formValues, setFormValues] = useState<Record<string, unknown>>({});
  const [executing, setExecuting] = useState(false);
  const [output, setOutput] = useState<Record<string, unknown> | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const selectedServer = MOCK_SERVERS.find((s) => s.id === selectedServerId)!;

  const handleSelectServer = useCallback((id: string) => {
    setSelectedServerId(id);
    setActiveTool(null);
    setFormValues({});
    setOutput(null);
  }, []);

  const handleRunTool = useCallback((tool: McpTool) => {
    setActiveTool(tool);
    setFormValues({});
    setOutput(null);
  }, []);

  const handleClosePanel = useCallback(() => {
    setActiveTool(null);
    setFormValues({});
    setOutput(null);
  }, []);

  const handleExecute = useCallback(() => {
    if (!activeTool) return;
    setExecuting(true);
    setOutput(null);
    setTimeout(() => {
      setOutput(activeTool.mockResponse);
      setExecuting(false);
    }, 1200);
  }, [activeTool]);

  const handleFormChange = useCallback((key: string, value: unknown) => {
    setFormValues((prev) => ({ ...prev, [key]: value }));
  }, []);

  return (
    <div className="flex h-screen w-full bg-[#0f172a] text-white overflow-hidden">
      {/* ---- Mobile sidebar toggle ---- */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="md:hidden fixed top-4 left-4 z-50 bg-[#1e293b] border border-slate-700 rounded-lg p-2"
      >
        <Server className="h-5 w-5 text-slate-300" />
      </button>

      {/* ---- Left sidebar ---- */}
      <aside
        className={`${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 fixed md:static z-40 h-full w-60 bg-[#0f172a] border-r border-slate-800 flex flex-col transition-transform`}
      >
        <div className="px-4 py-5 border-b border-slate-800">
          <h1 className="text-lg font-bold text-white tracking-tight">MCP Explorer</h1>
          <p className="text-xs text-slate-500 mt-1">Model Context Protocol</p>
        </div>

        <ScrollArea className="flex-1 px-2 py-3">
          <div className="flex flex-col gap-1">
            {MOCK_SERVERS.map((server) => (
              <ServerListItem
                key={server.id}
                server={server}
                selected={server.id === selectedServerId}
                onSelect={() => {
                  handleSelectServer(server.id);
                  if (window.innerWidth < 768) setSidebarOpen(false);
                }}
              />
            ))}
          </div>
        </ScrollArea>

        <div className="px-4 py-3 border-t border-slate-800">
          <p className="text-[10px] text-slate-600 uppercase tracking-wider">
            {MOCK_SERVERS.filter((s) => s.status === "connected").length} of{" "}
            {MOCK_SERVERS.length} connected
          </p>
        </div>
      </aside>

      {/* ---- Overlay for mobile sidebar ---- */}
      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 z-30 bg-black/50"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ---- Main content ---- */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="shrink-0 px-4 sm:px-6 py-4 border-b border-slate-800 flex items-center gap-3">
          <div className="md:hidden w-8" /> {/* spacer for mobile toggle */}
          <div className="flex items-center gap-3">
            <span
              className={`h-3 w-3 rounded-full ${
                selectedServer.status === "connected" ? "bg-emerald-400" : "bg-gray-500"
              }`}
            />
            <h2 className="text-lg font-semibold">{selectedServer.name}</h2>
            <Badge
              variant="outline"
              className={`text-xs ${
                selectedServer.status === "connected"
                  ? "border-emerald-600 text-emerald-400"
                  : "border-gray-600 text-gray-400"
              }`}
            >
              {selectedServer.status}
            </Badge>
          </div>
          <span className="ml-auto text-xs text-slate-500">
            {selectedServer.tools.length} tool{selectedServer.tools.length !== 1 ? "s" : ""}
          </span>
        </header>

        <div className="flex-1 flex overflow-hidden">
          {/* Tool grid */}
          <ScrollArea className="flex-1 p-4 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl">
              {selectedServer.tools.map((tool) => (
                <ToolCard
                  key={tool.name}
                  tool={tool}
                  onRun={() => handleRunTool(tool)}
                />
              ))}
            </div>
          </ScrollArea>

          {/* ---- Right slide-in panel ---- */}
          <div
            className={`${
              activeTool ? "translate-x-0" : "translate-x-full"
            } fixed md:static right-0 top-0 h-full w-full sm:w-[380px] bg-[#1e293b] border-l border-slate-700 flex flex-col z-50 transition-transform duration-300 ease-in-out`}
          >
            {activeTool && (
              <>
                {/* Panel header */}
                <div className="shrink-0 px-5 py-4 border-b border-slate-700 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold font-mono text-white">{activeTool.name}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">{activeTool.description}</p>
                  </div>
                  <button
                    onClick={handleClosePanel}
                    className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Panel body */}
                <ScrollArea className="flex-1 px-5 py-4">
                  <div className="flex flex-col gap-6">
                    {/* Form */}
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">
                        Input Parameters
                      </p>
                      <DynamicForm
                        schema={activeTool.inputSchema}
                        values={formValues}
                        onChange={handleFormChange}
                      />
                    </div>

                    {/* Execute */}
                    <Button
                      onClick={handleExecute}
                      disabled={executing}
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-white"
                    >
                      {executing ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Executing…
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          Execute
                        </>
                      )}
                    </Button>

                    {/* Output */}
                    {output && (
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">
                          Response
                        </p>
                        <OutputPanel data={output} />
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

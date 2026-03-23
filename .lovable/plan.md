

## Plano: Reconstruir MCP Dashboard como Control Panel funcional

### O que muda
Substituir o dashboard mock atual por um **Control Panel** real conectado ao banco de dados, com CRUD funcional, e criar uma Edge Function MCP Server.

### Componentes

**1. Edge Function `mcp-server`** — `supabase/functions/mcp-server/index.ts`
- Servidor MCP via JSON-RPC 2.0 com autenticação via `AGENT_SECRET`
- 7 ferramentas: `list_tables`, `query_records`, `create_record`, `update_record`, `delete_record`, `get_schema`, `execute_sql` (somente SELECT, validado no server)
- Usa `SUPABASE_SERVICE_ROLE_KEY` para bypass de RLS
- Não vou criar a função `execute_query` por segurança — o `execute_sql` usará queries parametrizadas via `supabase.rpc` apenas para SELECTs em tabelas do schema público
- CORS configurado corretamente

**2. Migração** — Criar 3 tabelas auxiliares
- `cp_contacts` (id uuid, name text, email text, phone text, tags text[], notes text, created_at timestamptz)
- `cp_tasks` (id uuid, title text, description text, status text default 'pending', priority text default 'medium', due_date date, created_at timestamptz)
- `cp_notes` (id uuid, title text, content text, category text, created_at timestamptz)
- RLS habilitado com policy de leitura/escrita para usuários autenticados
- Prefixo `cp_` para não conflitar com tabelas existentes

**3. Reconstruir `src/pages/McpDashboardPage.tsx`** — ~500 linhas
Layout de 3 painéis com tema dark-slate mantido:

- **Sidebar esquerda**: Lista as tabelas do banco (obtidas via edge function `mcp-server`). Mostra as 3 tabelas `cp_*` + todas as tabelas públicas do projeto. Clicar seleciona a tabela.

- **Área principal**: 
  - Header com nome da tabela selecionada e botão "Novo registro"
  - Campo de busca
  - Tabela de dados com paginação (100 registros por página)
  - Botões de editar e excluir em cada linha

- **Painel lateral direito (slide-in)**:
  - Abre ao clicar em "Novo" ou "Editar"
  - Formulário dinâmico gerado pelo schema da tabela (obtido via `get_schema`)
  - Campos: text → Input, boolean → Switch, number → Input type=number, date → Input type=date
  - Campos opcionais marcados com label "(opcional)"
  - Botão salvar/atualizar

- **Seção MCP Tools** na sidebar: botão para acessar o painel de teste de ferramentas MCP (mantém a funcionalidade anterior mas agora chamando a edge function real)

**4. Rota** — mantém `/mcp-dashboard`

### Fluxo de dados
```text
Browser → supabase.functions.invoke("mcp-server", { body: JSON-RPC }) → Edge Function → Supabase DB
```

### Segurança
- Edge function valida `AGENT_SECRET` no header Authorization
- No frontend, chamadas usam `supabase.functions.invoke()` (inclui token do usuário logado)
- A edge function aceita tanto AGENT_SECRET quanto JWT de usuário autenticado com role root_admin
- `execute_sql` rejeita qualquer query que não comece com SELECT
- Tabelas `cp_*` com RLS para usuários autenticados

### Arquivos
- `supabase/functions/mcp-server/index.ts` (novo)
- `src/pages/McpDashboardPage.tsx` (reescrita completa)
- Nova migração para tabelas `cp_contacts`, `cp_tasks`, `cp_notes`


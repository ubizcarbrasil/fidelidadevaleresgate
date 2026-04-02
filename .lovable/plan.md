

# Deploy do MCP Server existente

## Situação Atual
O arquivo `supabase/functions/mcp-server/index.ts` já existe com todas as ferramentas pedidas (list_tables, get_schema, query_records, create_record, update_record, delete_record). A autenticação já usa o `AGENT_SECRET` que está configurado nos secrets.

**Único problema:** a function não está registrada no `config.toml`, então nunca foi deployada.

## Implementação

### 1. Adicionar ao `config.toml`
Adicionar entrada `[functions.mcp-server]` com `verify_jwt = false` (a autenticação é feita em código via AGENT_SECRET).

### 2. Deploy
Deployar a function.

### 3. Informações de acesso
- **URL:** `https://rwhhabwgnkqjxcqwpcev.supabase.co/functions/v1/mcp-server`
- **Bearer Token:** o valor do secret `AGENT_SECRET` já configurado

## Arquivo modificado

| Arquivo | Alteração |
|---|---|
| `supabase/config.toml` | Adicionar `[functions.mcp-server]` |


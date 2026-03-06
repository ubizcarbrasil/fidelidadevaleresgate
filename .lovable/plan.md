

## Pontuação Automática via Webhook (Integração API Externa)

### Contexto
O sistema atual pontua clientes apenas via PDV manual (`EarnPointsPage`). Precisamos permitir que apps externos (ex: Ubiz Car) enviem um webhook ao final de uma corrida para pontuar automaticamente o cliente pelo CPF.

### Arquitetura

```text
┌──────────────┐    POST /earn-webhook     ┌───────────────────────┐
│  App Externo  │ ──────────────────────── > │  Edge Function         │
│  (Ubiz Car)   │   { cpf, purchase_value,  │  earn-webhook          │
│               │     store_id, receipt_code}│                        │
└──────────────┘   + Header: x-api-key     │  1. Valida API key     │
                                            │  2. Busca customer CPF │
                                            │  3. Busca points_rule  │
                                            │  4. Anti-fraude        │
                                            │  5. Insere earning_event│
                                            │  6. Insere points_ledger│
                                            │  7. Atualiza saldo     │
                                            │  8. Billing GG         │
                                            └───────────────────────┘
```

### Implementação — 4 partes

#### 1. Nova tabela `brand_api_keys`
Armazena as API keys que cada marca (SaaS) configura no painel para permitir integração externa.

```sql
CREATE TABLE public.brand_api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL,
  label text NOT NULL DEFAULT 'default',
  api_key_hash text NOT NULL,        -- SHA-256 hash da chave
  api_key_prefix text NOT NULL,      -- primeiros 8 chars para exibição
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz,
  created_by uuid
);
ALTER TABLE public.brand_api_keys ENABLE ROW LEVEL SECURITY;

-- RLS: brand admins manage their own keys
CREATE POLICY "Brand admins manage api keys" ON public.brand_api_keys
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'root_admin'::app_role) 
    OR brand_id IN (SELECT get_user_brand_ids(auth.uid()))
    OR brand_id IN (SELECT b.id FROM brands b WHERE b.tenant_id IN (SELECT get_user_tenant_ids(auth.uid()))));
```

#### 2. Edge Function `earn-webhook`
Nova Edge Function que:
- Valida `x-api-key` header contra `brand_api_keys` (hash SHA-256)
- Identifica `brand_id` a partir da key
- Busca customer por CPF + brand_id
- Busca `points_rules` ativa para a brand/store
- Aplica anti-fraude (limites diários, compra mínima)
- Insere `earning_event` (source: `API`), `points_ledger`, atualiza saldo
- Registra billing GG se ativo
- Retorna pontos creditados

**Payload esperado:**
```json
{
  "cpf": "12345678900",
  "store_id": "uuid",
  "purchase_value": 25.50,
  "receipt_code": "CORRIDA-12345"
}
```

**Resposta:**
```json
{
  "ok": true,
  "data": {
    "points_earned": 25,
    "money_earned": 2.50,
    "new_balance": 125,
    "customer_name": "João"
  }
}
```

#### 3. Adicionar enum value `API` ao earning_source
```sql
ALTER TYPE public.earning_source ADD VALUE IF NOT EXISTS 'API';
```

#### 4. Página de configuração de API Keys no painel da marca
Nova página `src/pages/BrandApiKeysPage.tsx` acessível pelo sidebar:
- Gerar nova API key (exibida uma única vez)
- Listar keys ativas com prefixo e data de criação
- Desativar/revogar keys
- Documentação inline do endpoint com exemplo curl
- Rota no sidebar: "🔑 Integrações API"

#### 5. Atualizações menores
- `supabase/config.toml`: adicionar `[functions.earn-webhook]` com `verify_jwt = false`
- `BrandSidebar.tsx`: adicionar item "Integrações API" no grupo de configurações
- `useMenuLabels.ts`: adicionar label `sidebar.api_keys`
- `App.tsx`: adicionar rota `/api-keys`

### Fluxo do administrador da marca
1. Acessa "Integrações API" no sidebar
2. Clica "Gerar Nova Chave"
3. Copia a API key (exibida uma vez)
4. Configura no app externo (Ubiz Car) o endpoint + header `x-api-key`
5. Corridas finalizadas enviam automaticamente o webhook → pontos creditados

### Segurança
- API keys armazenadas como hash SHA-256 (nunca em texto plano)
- Prefixo visível para identificação (ex: `dk_a1b2c3d4...`)
- Anti-fraude mantido (limites diários por cliente/loja)
- RLS protege gerenciamento das keys por brand


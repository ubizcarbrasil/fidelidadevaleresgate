

## Integração TaxiMachine — Plano de Implementação

### Visão Geral

Adicionar um módulo de integração com a **TaxiMachine** que permite ao Empreendedor (Brand Admin) ativar a pontuação automática de corridas inserindo suas credenciais de API. Após ativação, o sistema registra um webhook na TaxiMachine e passa a processar corridas finalizadas automaticamente, creditando pontos (1 Real = 1 ponto).

---

### 1. Banco de Dados — 2 novas tabelas + migração

**`machine_integrations`** — credenciais e estado da integração por marca:
- `id` (uuid PK), `brand_id` (uuid FK brands, UNIQUE), `api_key` (text), `basic_auth_user` (text), `basic_auth_password` (text), `webhook_registered` (boolean default false), `is_active` (boolean default false), `last_webhook_at` (timestamptz), `last_ride_processed_at` (timestamptz), `total_rides` (int default 0), `total_points` (int default 0), `created_at`, `updated_at`
- RLS: leitura/escrita restrita ao brand_admin da marca correspondente (via `get_user_brand_ids`)

**`machine_rides`** — registro de cada corrida processada:
- `id` (uuid PK), `brand_id` (uuid FK), `machine_ride_id` (text, UNIQUE com brand_id), `passenger_cpf` (text), `ride_value` (numeric), `ride_status` (text), `points_credited` (int), `finalized_at` (timestamptz), `processed_at` (timestamptz default now()), `created_at`
- Índice UNIQUE em `(brand_id, machine_ride_id)` para anti-duplicação
- RLS: mesma lógica de brand_id

---

### 2. Edge Function — `machine-webhook`

Endpoint que recebe eventos da TaxiMachine:

1. Autenticação via header `x-api-secret` (segredo por marca, armazenado em `machine_integrations.api_key`)
2. Lê `request_id` e `status_code` do payload
3. Se `status_code = "F"` (finalizada):
   - Chama a API da TaxiMachine (`GET /api/integracao/solicitacaoStatus`) usando as credenciais armazenadas
   - Chama `GET /api/integracao/recibo` para obter o valor
   - Busca o CPF do passageiro via endpoint de cliente
   - Verifica se `machine_ride_id` já existe (anti-duplicação)
   - Localiza ou cria o cliente no sistema de fidelidade
   - Calcula pontos: `floor(ride_value)`
   - Insere em `machine_rides`, `points_ledger`, atualiza saldo do cliente
   - Atualiza contadores na `machine_integrations`

Rate limit: 30 req/60s (mesmo padrão do `earn-webhook`).

---

### 3. Edge Function auxiliar — `register-machine-webhook`

Chamada pelo frontend ao clicar "Ativar Integração":

1. Valida credenciais chamando a API TaxiMachine
2. Registra webhook via `POST /api/integracao/cadastrarWebhook` com tipo `status` e URL apontando para a edge function `machine-webhook`
3. Marca `webhook_registered = true` e `is_active = true` na tabela

---

### 4. Página do Dashboard — `MachineIntegrationPage.tsx`

Nova página em `/machine-integration` com:

- **Formulário de credenciais**: API Key, Basic Auth User, Basic Auth Password (campos com máscara de senha)
- **Botão "Ativar Integração"**: chama a edge function `register-machine-webhook`
- **Painel de status** (após ativação):
  - Status: Ativo / Inativo (badge colorido)
  - Último webhook recebido
  - Última corrida processada
  - Total de corridas processadas
  - Total de pontos gerados
- **Botão "Desativar"** para pausar a integração

---

### 5. Navegação e Rotas

- Adicionar item no `BrandSidebar.tsx` no grupo **"Técnico"**: `{ key: "sidebar.machine", defaultTitle: "TaxiMachine", url: "/machine-integration", icon: Car, moduleKey: "machine_integration" }`
- Adicionar rota em `App.tsx`: `<Route path="machine-integration" element={<MachineIntegrationPage />} />`
- Registrar módulo `machine_integration` na tabela `module_definitions` para controle via `ModuleGuard`

---

### 6. Segurança

- Credenciais armazenadas na tabela com RLS restrita (não expostas no frontend após salvar — campo de senha com "••••••")
- Edge function `machine-webhook` com `verify_jwt = false` (webhook externo) — autenticação via validação de credenciais da marca
- Edge function `register-machine-webhook` autenticada via JWT do usuário logado
- Anti-duplicação garantida pelo índice UNIQUE `(brand_id, machine_ride_id)`

---

### Arquivos a criar/modificar

| Arquivo | Ação |
|---|---|
| Migração SQL | Criar tabelas `machine_integrations` e `machine_rides` com RLS |
| `supabase/functions/machine-webhook/index.ts` | Nova edge function para receber eventos |
| `supabase/functions/register-machine-webhook/index.ts` | Nova edge function para registrar webhook |
| `supabase/config.toml` | Adicionar `[functions.machine-webhook]` e `[functions.register-machine-webhook]` |
| `src/pages/MachineIntegrationPage.tsx` | Nova página com formulário + dashboard |
| `src/components/consoles/BrandSidebar.tsx` | Adicionar link no menu |
| `src/App.tsx` | Adicionar rota |


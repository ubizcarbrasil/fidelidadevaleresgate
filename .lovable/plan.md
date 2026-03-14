

## Plano: Múltiplas integrações por cidade (branch)

### Problema atual
A tabela `machine_integrations` tem uma constraint **UNIQUE** em `brand_id`, permitindo apenas **uma integração por marca**. Como cada cidade (branch) tem seu próprio login/senha na TaxiMachine, é preciso suportar múltiplas integrações — uma por cidade.

### O que será feito

**1. Alteração no banco de dados (migração)**
- Adicionar coluna `branch_id` (UUID, FK para `branches`) na tabela `machine_integrations`
- Remover a constraint UNIQUE de `brand_id` 
- Adicionar nova constraint UNIQUE em `(brand_id, branch_id)` — uma integração por cidade
- Atualizar o `onConflict` dos upserts para usar `brand_id,branch_id`

**2. Edge Function `register-machine-webhook`**
- Aceitar `branch_id` no body
- Upsert com conflict em `brand_id,branch_id`
- Incluir `branch_id` na URL do webhook para roteamento correto

**3. Edge Function `machine-webhook`**
- Extrair `branch_id` da query string ou do body
- Buscar integração por `brand_id + branch_id` (ou fallback por `api_key`)
- Ao criar clientes novos, vincular à branch correta (não mais "primeira branch da marca")

**4. UI — Página de Integração (`MachineIntegrationPage.tsx`)**
- Adicionar seletor de cidade (branch) no topo
- Listar integrações existentes com status por cidade
- Permitir ativar/desativar cada cidade individualmente
- Cada cidade mostra seus próprios contadores (corridas, pontos, último evento)
- Formulário de ativação inclui campo de seleção de cidade

### Alterações

| Arquivo | Ação |
|---|---|
| Migração SQL | Adicionar `branch_id`, trocar constraint unique |
| `supabase/functions/register-machine-webhook/index.ts` | Suportar `branch_id` no activate/deactivate |
| `supabase/functions/machine-webhook/index.ts` | Buscar integração por `brand_id + branch_id` |
| `src/pages/MachineIntegrationPage.tsx` | UI multi-cidade com seletor e lista de integrações |


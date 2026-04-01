

# Adicionar Credenciais de Integração no Formulário de Edição de Cidade

## Problema

O formulário de edição de cidade (`BrandBranchForm.tsx`) não possui campos para API Key, Usuário e Senha da cidade. Cada cidade precisa de suas próprias credenciais para receber corridas em tempo real via TaxiMachine.

## O que será feito

Adicionar uma seção "Credenciais da Cidade" no formulário com três campos:
- **API Key** da cidade
- **Usuário** (basic_auth_user)
- **Senha** (basic_auth_password)

Ao salvar, o formulário invocará a Edge Function `register-machine-webhook` (já existente) para persistir as credenciais na tabela `machine_integrations` e registrar o webhook automaticamente.

No modo edição, os campos serão pré-preenchidos com os valores existentes da integração.

## Detalhes técnicos

### Arquivo: `src/pages/BrandBranchForm.tsx`

1. **Novos estados**: `apiKey`, `basicAuthUser`, `basicAuthPassword`
2. **Query existente ampliada**: a query de `machine_integrations` já busca dados por `branch_id` — ampliar o `select` para incluir `api_key, basic_auth_user, basic_auth_password` além de `telegram_chat_id`
3. **Novos campos na UI**: Card "Credenciais de Integração" com inputs para API Key, Usuário e Senha (tipo password)
4. **Salvar**: após criar/atualizar a branch, chamar `supabase.functions.invoke("register-machine-webhook")` com `{ brand_id, branch_id, api_key, basic_auth_user, basic_auth_password, telegram_chat_id }` — isso já faz upsert na `machine_integrations` e tenta registrar o webhook
5. **Para criação**: precisar do `branch_id` retornado do insert (usar `.insert().select().single()` para obter o id)


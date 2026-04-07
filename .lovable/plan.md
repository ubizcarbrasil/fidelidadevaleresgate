

## Reorganização da Integração TaxiMachine + CURLs de Pontuação do Cliente

### Contexto — As 3 responsabilidades distintas da API

Após análise do código, identifiquei que o sistema já trata as 3 responsabilidades, mas estão misturadas na interface e na configuração. Vou reorganizar:

```text
┌─────────────────────────────────────────────────────────────────────┐
│  1. NOTIFICAÇÃO DO MOTORISTA (Chat)                                │
│  - API da CIDADE (api_key da filial)                               │
│  - Endpoint: POST /api/integracao/enviarMensagem                   │
│  - Credenciais: api_key + basic_auth da CIDADE                     │
│  - Cada cidade tem sua própria chave                               │
├─────────────────────────────────────────────────────────────────────┤
│  2. PONTUAR MOTORISTA (Status da corrida)                          │
│  - Recebido via WEBHOOK ou URL manual                              │
│  - Credenciais da CIDADE para buscar dados da corrida (V1)         │
│  - Opção: Webhook automático OU URL manual (status router)         │
│  - Cada cidade escolhe seu modo                                    │
├─────────────────────────────────────────────────────────────────────┤
│  3. PONTUAR PASSAGEIRO (Recibo + Cliente)                          │
│  - API da MATRIZ (headquarters)                                    │
│  - Endpoint: GET /api/integracao/recibo?id_mch=XXX                 │
│  - Endpoint: GET /api/integracao/cliente?id=XXX                    │
│  - Credenciais: matrix_api_key + matrix_basic_auth                 │
│  - UMA SÓ configuração para TODAS as cidades do empreendedor      │
└─────────────────────────────────────────────────────────────────────┘
```

### CURL — Pontuar o Cliente (Passageiro)

O fluxo de pontuação do passageiro é **acionado automaticamente** quando uma corrida é finalizada (status `F`). O webhook/URL recebe o status, e internamente o sistema chama a API da Matriz para obter o recibo e identificar o passageiro.

**Passo 1 — Corrida finalizada chega via webhook:**
```bash
curl -X POST \
  "https://rwhhabwgnkqjxcqwpcev.supabase.co/functions/v1/machine-webhook?brand_id=SEU_BRAND_ID&branch_id=SEU_BRANCH_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "request_id": "100012345",
    "status_code": "F",
    "links": {
      "driver": "https://api.taximachine.com.br/api/v1/driver/999"
    }
  }'
```

**Internamente o sistema faz (Passo 2 — buscar recibo com credenciais MATRIZ):**
```bash
curl -X GET \
  "https://api.taximachine.com.br/api/integracao/recibo?id_mch=100012345" \
  -H "api-key: mch_api_qyFEYa1MF8mTpPawwKmkMyCF" \
  -H "Authorization: Basic $(echo -n 'Fidelidade@ubiz.com:Fidelidade@11' | base64)" \
  -H "Content-Type: application/json"
```
> Retorna: valor da corrida, CPF do passageiro, nome, motorista

**Internamente (Passo 3 — buscar detalhes do cliente com credenciais MATRIZ):**
```bash
curl -X GET \
  "https://api.taximachine.com.br/api/integracao/cliente?id=CLIENTE_ID_DO_RECIBO" \
  -H "api-key: mch_api_qyFEYa1MF8mTpPawwKmkMyCF" \
  -H "Authorization: Basic $(echo -n 'Fidelidade@ubiz.com:Fidelidade@11' | base64)" \
  -H "Content-Type: application/json"
```
> Retorna: telefone, email, CPF — dados para criar/identificar o passageiro no sistema

### Plano de reorganização da interface

**1. Separar a configuração da Matriz do nível de cidade**

A `matrix_api_key`, `matrix_basic_auth_user` e `matrix_basic_auth_password` devem ser configuradas UMA VEZ no nível da **marca (brand)**, não por cidade. Atualmente estão na tabela `machine_integrations` que é por cidade.

- Criar colunas `matrix_api_key`, `matrix_basic_auth_user`, `matrix_basic_auth_password` na tabela `brands` (migração)
- Migrar dados existentes das integrações para a marca
- Atualizar as Edge Functions para buscar credenciais Matrix da marca quando não encontrar na integração

**2. Reorganizar a página de integração em 3 seções claras**

Arquivo: `src/pages/MachineIntegrationPage.tsx`

- **Seção 1 — Matriz (nível marca)**: Credenciais da API matriz, configuradas uma vez, alimenta todas as cidades
- **Seção 2 — Cidade (nível filial)**: API key da cidade, modo de recebimento (webhook automático vs URL manual), credenciais básicas
- **Seção 3 — Notificações**: Configuração de mensagens ao motorista via chat

**3. Adicionar seletor de modo de recebimento por cidade**

Na seção da cidade, radio button claro:
- ☑ Webhook automático (sistema registra webhook na TaxiMachine)
- ☑ URL manual (copiar URL e colar no status router da TaxiMachine)

**4. Atualizar Edge Functions**

- `machine-webhook/index.ts`: buscar `matrix_*` da marca quando não existir na integração da cidade
- `register-machine-webhook/index.ts`: salvar credenciais Matrix na marca, não na integração
- `_shared/fetchRideData.ts`: sem alteração (já recebe headers como parâmetro)

### Arquivos

- **Migração**: adicionar colunas matrix na `brands`, migrar dados
- **Editar**: `src/pages/MachineIntegrationPage.tsx` — reorganizar em 3 seções
- **Editar**: `supabase/functions/machine-webhook/index.ts` — fallback matrix da marca
- **Editar**: `supabase/functions/register-machine-webhook/index.ts` — salvar matrix na marca
- **Editar**: `supabase/functions/retry-failed-rides/index.ts` — fallback matrix da marca


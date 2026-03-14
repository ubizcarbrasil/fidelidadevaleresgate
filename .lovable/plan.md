

## Diagnóstico e Plano de Correção — Telegram + Pontuações

### Situação Atual

A infraestrutura do Telegram está **quase completa** — a edge function `send-telegram-ride-notification` existe, a tabela `machine_ride_notifications` existe, o conector Telegram está vinculado, e a UI tem o campo de Chat ID e o painel "Últimas pontuações".

**Porém, nenhuma notificação foi enviada ainda** por dois motivos:

1. **Credenciais TaxiMachine inválidas** — todas as corridas finalizadas falham com `401 Unauthorized` ao buscar recibo/status na API TaxiMachine. Sem o recibo, o sistema não obtém CPF nem valor, então não credita pontos e não dispara Telegram. **Isso é configuração sua** — precisa corrigir usuário/senha da integração de Araxá.

2. **Bug no código do webhook** — a variável `branches_cache` na linha 338 nunca foi definida, o que causaria erro se pontos fossem creditados.

3. **Integração legada ativa** — existe uma integração sem cidade e sem credenciais (id: `a491dc74...`) que pode interceptar webhooks antes da integração correta.

### Correções necessárias

| Item | Tipo | Descrição |
|---|---|---|
| Remover `branches_cache` | Bug fix | Eliminar referência à variável inexistente no webhook; usar apenas o fetch direto de branch |
| Desativar integração legada | DB fix | `UPDATE machine_integrations SET is_active = false WHERE id = 'a491dc74-...'` |
| Nenhuma mudança na UI | — | O painel e campo Telegram já estão implementados |

### O que **você** precisa fazer

- **Corrigir as credenciais** da TaxiMachine na página de Mobilidade (desativar Araxá e reativar com usuário/senha corretos)
- **Configurar o Chat ID** do Telegram no campo que já aparece na página

### Arquivos impactados

| Arquivo | Ação |
|---|---|
| `supabase/functions/machine-webhook/index.ts` | Remover `branches_cache`, simplificar lógica de city name |
| Migration SQL | Desativar integração legada |


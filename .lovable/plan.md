

## Diagnóstico: Por que algumas corridas pontuam e outras dão erro

### Problema identificado

Analisei os logs e o banco de dados e encontrei **dois problemas distintos**:

**Problema 1 — Credenciais Basic Auth vazias (causa principal)**
As credenciais `basic_auth_user` e `basic_auth_password` na tabela de integrações estão **vazias**. Quando uma corrida é finalizada (status `F`), o webhook tenta consultar a API da TaxiMachine para obter o valor da corrida e o CPF do passageiro, mas recebe erro 401 ("Access credentials are invalid") porque as credenciais estão em branco.

- Corridas com status `P`, `A`, `S`, `C` funcionam normalmente porque **não precisam chamar a API da TaxiMachine** — apenas registram o status.
- Corridas com status `F` (finalizada) **sempre falham** porque precisam buscar o recibo na API externa.

Confirmação: **nenhuma corrida foi pontuada** — todas têm `points_credited = 0` e nenhuma chegou ao status `FINALIZED` no banco.

**Problema 2 — Erro no audit_log**
O campo `entity_id` na tabela `audit_logs` é do tipo UUID, mas o código está passando o `machine_ride_id` (ex: "675512794") que é um número, não um UUID. Isso gera o erro `invalid input syntax for type uuid`.

### Plano de correção

| Arquivo | Ação |
|---|---|
| `supabase/functions/machine-webhook/index.ts` | 1. Na função `logAudit`, não passar `machine_ride_id` como `entity_id` — mover para `details_json` em vez disso. 2. Verificar se `basic_auth_user` e `basic_auth_password` existem antes de chamar a API da TaxiMachine; se estiverem vazios, registrar o valor da corrida como 0 e retornar mensagem clara de erro. |
| `src/pages/MachineIntegrationPage.tsx` | Exibir alerta visual quando as credenciais Basic Auth estiverem vazias e a integração estiver ativa, avisando que corridas finalizadas não serão pontuadas sem as credenciais. |

### Sobre as credenciais
O usuário precisa preencher o **usuário e senha de integração da TaxiMachine** na aba "Por credenciais" da página de integração. Sem isso, o sistema recebe o webhook mas não consegue buscar o valor da corrida para calcular os pontos.


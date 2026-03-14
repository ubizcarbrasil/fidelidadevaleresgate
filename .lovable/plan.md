

## Plano: Webhook genérico para acompanhamento de corridas em tempo real

### Situação atual
A URL do webhook já existe: `https://rwhhabwgnkqjxcqwpcev.supabase.co/functions/v1/machine-webhook`. Porém, o endpoint atual **ignora todos os eventos que não são `status_code = "F"` (finalizada)**. Para acompanhamento em tempo real, precisamos processar todos os status (P=Pendente, A=Aceita, S=em andamento, C=Cancelada, N=Negada, F=Finalizada).

### O que será feito

**1. Nova tabela `machine_ride_events` (migração)**
Armazenar cada evento de status recebido para histórico e tracking em tempo real:
- `id`, `brand_id`, `machine_ride_id`, `status_code`, `raw_payload` (jsonb), `ip_address`, `created_at`
- Realtime habilitado para push ao app do cliente
- RLS: leitura por usuários da marca

**2. Atualizar o Edge Function `machine-webhook`**
- Remover o retorno antecipado para `status_code !== "F"` — agora todos os eventos são gravados na `machine_ride_events`
- Manter a lógica de pontuação **apenas** para `status_code = "F"` (sem mudança no fluxo existente)
- Gravar o payload completo recebido para debug e auditoria

**3. Atualizar a tabela `machine_rides` com status em tempo real**
- Fazer upsert no `ride_status` do `machine_rides` a cada evento (ex: PENDING → ACCEPTED → IN_PROGRESS → FINALIZED)
- O campo já existe, hoje só recebe "FINALIZED" ou "NO_VALUE"

**4. Exibir a URL do webhook na página de integração**
- Mostrar a URL copiável na `MachineIntegrationPage.tsx` para que o usuário cole na plataforma externa (ubiz-dinâmica ou outra)
- Formato: `https://rwhhabwgnkqjxcqwpcev.supabase.co/functions/v1/machine-webhook`

### URL do Webhook
A URL que você vai colar na plataforma externa é:
```
https://rwhhabwgnkqjxcqwpcev.supabase.co/functions/v1/machine-webhook
```
A autenticação é feita via header `x-api-secret` com a API Key configurada na integração, ou via `brand_id` no body.

### Resumo das alterações
| Componente | Ação |
|---|---|
| Migração SQL | Criar `machine_ride_events` + habilitar realtime |
| `machine-webhook/index.ts` | Aceitar todos os status, gravar eventos, upsert ride status |
| `MachineIntegrationPage.tsx` | Exibir URL do webhook copiável |


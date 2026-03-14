

## Plano: Notificação Telegram + Painel de pontuações em tempo real

### Resumo
Quando uma corrida for finalizada e pontos creditados, o sistema enviará automaticamente uma notificação via Telegram com os dados do passageiro. Além disso, será criado um painel de "Últimas pontuações" no dashboard do empreendedor com atualização em tempo real.

### Pré-requisito: Conectar Telegram
O Telegram está disponível como conector nativo. Será necessário conectar um bot do Telegram ao projeto (via BotFather) e configurar o `chat_id` do grupo/canal onde as notificações serão enviadas.

---

### 1. Banco de dados — Adicionar `telegram_chat_id` à tabela `machine_integrations`

```sql
ALTER TABLE public.machine_integrations 
ADD COLUMN telegram_chat_id TEXT DEFAULT NULL;
```

Isso permite configurar um chat_id por integração (por cidade).

### 2. Tabela `machine_ride_notifications` (feed do empreendedor)

Nova tabela para armazenar as notificações de pontuação com todos os dados solicitados, habilitada para Realtime:

```sql
CREATE TABLE public.machine_ride_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id),
  branch_id UUID REFERENCES branches(id),
  machine_ride_id TEXT NOT NULL,
  customer_name TEXT,
  customer_phone TEXT,
  customer_cpf_masked TEXT,
  city_name TEXT,
  points_credited INTEGER NOT NULL DEFAULT 0,
  ride_value NUMERIC(10,2) NOT NULL DEFAULT 0,
  finalized_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.machine_ride_notifications ENABLE ROW LEVEL SECURITY;

-- RLS: brand members can read their own brand's notifications
CREATE POLICY "Brand members can read notifications"
ON public.machine_ride_notifications FOR SELECT TO authenticated
USING (brand_id IN (SELECT get_user_brand_ids(auth.uid())));

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.machine_ride_notifications;
```

### 3. Edge Function — `send-telegram-ride-notification`

Nova edge function que recebe os dados da pontuação e envia a mensagem formatada via Telegram Bot API (usando o connector gateway):

**Mensagem formatada:**
```
🎯 Nova pontuação por corrida!

👤 Nome: Passageiro •••1234
📱 Telefone: (69) 9xxxx-xxxx
🏙️ Cidade: Porto Velho - RO
💰 Valor da corrida: R$ 45,00
🪙 Pontos creditados: 45
🕐 Finalizada em: 14/03/2026 15:30
```

### 4. Webhook `machine-webhook` — Disparar notificação

Após creditar pontos com sucesso (`pointsCredited = true`), o webhook fará duas coisas adicionais (fire-and-forget):

1. **Inserir na tabela `machine_ride_notifications`** — alimenta o painel em tempo real
2. **Invocar `send-telegram-ride-notification`** — se `telegram_chat_id` estiver configurado na integração

### 5. UI — Painel de pontuações em tempo real (`MachineIntegrationPage.tsx`)

Novo card **"Últimas pontuações"** entre o feed de eventos e o painel de clientes, com:
- Lista em tempo real (Supabase Realtime na tabela `machine_ride_notifications`)
- Cada item mostra: nome, telefone (mascarado), cidade, valor, pontos, horário
- Badge visual destacando a pontuação

### 6. UI — Configuração do Telegram (`MachineIntegrationPage.tsx`)

Dentro do card de cada cidade ativa, adicionar:
- Campo **"Chat ID do Telegram"** com botão Salvar
- Instrução: "Crie um bot no @BotFather, adicione ao grupo e use @userinfobot para obter o chat_id"

---

### Arquivos impactados

| Arquivo | Mudança |
|---|---|
| Migration SQL | Criar tabela `machine_ride_notifications` + coluna `telegram_chat_id` |
| `supabase/functions/send-telegram-ride-notification/index.ts` | Nova edge function para enviar via Telegram gateway |
| `supabase/functions/machine-webhook/index.ts` | Inserir notificação + chamar Telegram após pontuação |
| `src/pages/MachineIntegrationPage.tsx` | Painel de pontuações em tempo real + campo Telegram chat_id |
| `supabase/config.toml` | Registrar nova function |


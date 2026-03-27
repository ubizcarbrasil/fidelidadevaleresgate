

## Plano: Configuração de pontos do motorista, aba Motoristas e notificação Telegram

### Resumo

O usuário quer três coisas:
1. **Configuração no painel do empreendedor** para definir quanto o motorista ganha por real (substituindo/complementando o percentual atual)
2. **Aba "Motoristas"** no painel de integração para consultar motoristas pontuados e seus saldos
3. **Notificação Telegram** informando quando o motorista foi pontuado e quantos pontos recebeu

### Alterações

**1. Banco de dados — `machine_integrations`**
- Adicionar coluna `driver_points_per_real` (numeric, default 1) — pontos por R$1 para o motorista
- Adicionar coluna `driver_points_mode` (text, default 'PERCENT') — modo: 'PERCENT' (percentual do passageiro) ou 'PER_REAL' (pontos por R$ da corrida)

Isso permite ao empreendedor escolher entre o modelo atual (percentual) ou o novo (pontos por real).

**2. UI — `MachineIntegrationPage.tsx` — Seção de configuração**
- Expandir a seção "Pontuação do Motorista" existente:
  - Seletor de modo: "Percentual do passageiro" vs "Pontos por R$ da corrida"
  - Se "Percentual": campo de percentual (já existe)
  - Se "Por R$": campo numérico de pontos por real (novo)
  - Texto explicativo dinâmico com simulação

**3. UI — Novo componente `ScoredDriversPanel`**
- Criar `src/components/machine-integration/ScoredDriversPanel.tsx`
- Similar ao `ScoredCustomersPanel` existente, mas filtra customers com tag `[MOTORISTA]` no nome
- Exibe: nome, CPF, telefone, saldo de pontos, total de pontos de corridas
- Busca por nome/CPF/telefone
- Drawer lateral com extrato (ledger) do motorista
- Botão de exportar CSV

**4. UI — `MachineIntegrationPage.tsx` — Aba "Motoristas"**
- Adicionar o componente `ScoredDriversPanel` logo após o `ScoredCustomersPanel`, ou como aba separada
- Renderizar apenas quando `driver_points_enabled` estiver ativo em alguma integração

**5. Edge Function `machine-webhook/index.ts` — Lógica de pontuação do motorista**
- Suportar o novo modo `PER_REAL`: `driverPoints = Math.floor(rideValue * driver_points_per_real)`
- Manter compatibilidade com modo `PERCENT` existente

**6. Edge Function `machine-webhook/index.ts` — Telegram do motorista**
- Após pontuar o motorista com sucesso, enviar segunda notificação Telegram com os dados do motorista
- Reutilizar a mesma edge function `send-telegram-ride-notification` com novos campos ou criar mensagem inline

**7. Edge Function `send-telegram-ride-notification/index.ts`**
- Aceitar campo `is_driver_notification` (boolean) e `driver_points` no body
- Se for notificação de motorista, usar template diferente:
  - "🚗 Motorista pontuado! [nome] recebeu X pts pela corrida #Y (R$ Z)"

### Detalhes técnicos

- A query de motoristas filtra `customers` com `name ILIKE '%[MOTORISTA]%'` e join com `machine_rides.driver_customer_id`
- O extrato do motorista usa `points_ledger` com `reason ILIKE '%Motorista%'`
- A notificação Telegram do motorista é fire-and-forget, igual à do passageiro

### O que NÃO muda
- Fluxo de pontuação do passageiro (inalterado)
- `ScoredCustomersPanel` existente (inalterado)
- RLS, auth, guards



## Plano: Completar Notificações Push de Duelos

### Diagnóstico atual
- ✅ `servico_notificacoes_duelo.ts` já dispara notificações in-app para: desafio, aceite, recusa, início, resultado
- ✅ `send-push-notification` edge function salva em `customer_notifications`
- ❌ Contraproposta usa tipo genérico `DUEL_CHALLENGE_RECEIVED` ao invés de tipo próprio
- ❌ O `finalize-duels-cron` NÃO envia notificações quando auto-finaliza duelos
- ❌ Notificações de duelo NÃO são enviadas via TaxiMachine (só ficam no app)

### O que será feito

**1. Novo tipo `DUEL_COUNTER_PROPOSAL`** no serviço de notificações
- Mensagem: "Fulano fez uma contraproposta de X pontos"
- Atualizar `useCounterPropose` para usar o novo tipo

**2. Notificações no `finalize-duels-cron`**
- Após auto-finalizar cada duelo, chamar `send-push-notification` para ambos os participantes
- Enviar notificação de vitória/derrota/empate conforme resultado

**3. Entrega via TaxiMachine no `send-push-notification`**
- Quando o `reference_type` for de duelo (`duel_*`), buscar `external_driver_id` e `machine_integrations`
- Enviar mensagem via API TaxiMachine como complemento à notificação in-app
- Reutilizar o padrão de envio já existente no `notify-driver-points`

### Arquivos

| Arquivo | Ação |
|---------|------|
| `servico_notificacoes_duelo.ts` | Adicionar `DUEL_COUNTER_PROPOSAL` |
| `hook_duelos.ts` | Atualizar `useCounterPropose` |
| `finalize-duels-cron/index.ts` | Adicionar envio de notificações |
| `send-push-notification/index.ts` | Adicionar entrega TaxiMachine para duelos |

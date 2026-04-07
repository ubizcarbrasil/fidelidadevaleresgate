

## Plano: Nome da cidade como primeira linha na notificação Telegram

### Mudança
Mover o nome da cidade para a **primeira linha** da mensagem, acima do título, nos dois templates (motorista e passageiro).

### Arquivo modificado
- `supabase/functions/send-telegram-ride-notification/index.ts`

### Antes (motorista)
```
🚗 Motorista pontuado!

👤 Motorista: João
...
🏙️ Cidade: Leme - SP
```

### Depois
```
📍 Leme - SP
🚗 Motorista pontuado!

👤 Motorista: João
...
```

### Detalhes técnicos
- Nos dois arrays de mensagem (driver e passenger), adicionar `📍 <b>${city_name}</b>` como primeiro elemento (quando `city_name` existir)
- Remover a linha `🏙️ Cidade: ${city_name}` do meio do template para evitar duplicação
- Deploy da edge function `send-telegram-ride-notification`


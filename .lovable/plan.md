

## Plano: Melhorar responsividade da aba Pontuar Motorista (430px)

### Problemas identificados

1. **`card_config_cidade.tsx`**: Grid de KPIs usa `grid-cols-2 md:grid-cols-4` — OK, mas os StatusCards podem ficar apertados. Botões de ação (Remover/Desativar) ficam lado a lado e podem transbordar. Webhook URL + botão copy em `flex` pode comprimir o código.
2. **`card_adicionar_cidade.tsx`**: `max-w-md` no CardContent limita mas é OK. RadioGroup com `flex gap-4` pode ficar apertado. Webhook URL activada com `flex` pode comprimir.
3. **`aba_pontuar_motorista.tsx`**: Linhas de eventos em tempo real (`flex items-center gap-3`) com badge + ride ID + valor + horário podem transbordar. Diagnóstico header com título + botão "Reprocessar" em `flex justify-between` pode comprimir.
4. **`card_cidades_conectadas.tsx`**: Grid `sm:grid-cols-2` — em 430px fica 1 coluna, OK.

### Mudanças por arquivo

**`aba_pontuar_motorista.tsx`**
- Eventos em tempo real: trocar `flex items-center gap-3` para `flex flex-wrap items-center gap-2` nos itens de evento, permitindo quebra de linha em mobile
- Botão "Adicionar cidade" no topo: usar `w-full sm:w-auto` para ocupar largura total em mobile
- DiagnosticoWebhook: trocar header de `flex items-center justify-between` para `flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between`, empilhando título e botão em mobile
- Botão "Reprocessar falhas": usar `w-full sm:w-auto`

**`card_config_cidade.tsx`**
- Botões de ação (Remover/Desativar): trocar `flex items-center gap-2` para `flex flex-col gap-2 sm:flex-row sm:items-center`, empilhando verticalmente em mobile com `w-full` nos botões
- Webhook URL container: garantir que o `code` quebre corretamente (já tem `break-all`, OK)
- Callback URL: remover `max-w-lg` para usar largura total em mobile
- Webhook status + test button: trocar para `flex flex-col gap-2 sm:flex-row sm:items-center`
- Driver Points: switch + label container — trocar para `flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between`

**`card_adicionar_cidade.tsx`**
- RadioGroup: trocar `flex gap-4` para `flex flex-col gap-2 sm:flex-row sm:gap-4`
- Botão "Ativar cidade": adicionar `w-full sm:w-auto`
- Remover `max-w-md` do CardContent para usar largura total em mobile
- Webhook URL ativada: já tem `break-all`, OK

### Resumo
Ajustes puramente de classes Tailwind em 3 arquivos — sem mudança de lógica ou estrutura. Foco em empilhar elementos verticalmente em telas estreitas e garantir botões com largura total em mobile.


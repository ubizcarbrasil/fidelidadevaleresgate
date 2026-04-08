

## Ocultar cards vazios no dashboard

### Problema
Os cards "Denúncias de Ofertas" e "Tarefas Pendentes" aparecem mesmo sem atividade, exibindo mensagens como "Nenhuma denúncia pendente" e "Tudo em dia!". Eles devem ficar ocultos quando não há itens.

### Solução
Alterar os dois componentes para retornar `null` no estado vazio em vez de renderizar o card com mensagem.

### Arquivos

**`src/components/dashboard/PendingReportsSection.tsx`** (linha 117-133)
- Trocar o bloco `if (!reports || reports.length === 0)` para retornar `null`

**`src/components/dashboard/TasksSection.tsx`** (linha 114-126)
- Trocar o bloco `if (tasks.length === 0)` para retornar `null`

Ambos os estados de loading permanecem iguais para evitar layout shift.


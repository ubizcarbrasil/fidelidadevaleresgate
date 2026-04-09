

# Corrigir duelos "Agendados" que já deveriam estar "Em andamento"

## Diagnóstico

O problema **não é no CardDueloPublico** — o badge "Em andamento" já existe no código (linha 87). O problema está na **classificação do duelo**: o cron que muda o status de `accepted` para `live` roda a cada 5 minutos, então existe um gap onde o duelo já começou (`start_at` passou) mas o status ainda é `accepted`. Nesse caso, o DuelsHub coloca o duelo na seção "Agendados" e passa `contextoSecao="agendado"`, forçando o badge errado.

## Solução

Adicionar lógica client-side para tratar duelos com `status === "accepted"` cujo `start_at` já passou como se fossem `live`.

### 1. `src/components/driver/duels/DuelsHub.tsx`
- Na filtragem de `duelosCidadeAoVivo` (linha 58-61): incluir duelos `accepted` cujo `start_at <= now`
- Na filtragem de `duelosCidadeAgendados` (linha 63-66): excluir duelos `accepted` cujo `start_at <= now`
- Mesma lógica para `liveDuels` do próprio motorista (linha 94-96)

### 2. `src/components/driver/duels/CardDueloPublico.tsx`
- Na lógica de classificação (linhas 47-50): quando `contextoSecao` não é fornecido e o duelo é `accepted` mas `start_at` já passou, tratar como `aoVivo = true` em vez de `agendado`
- Isso garante que mesmo sem `contextoSecao`, o card mostra o badge correto

### 3. `src/components/driver/duels/SecaoDuelosCidade.tsx`
- Aplicar a mesma lógica de filtragem se houver separação ao vivo / agendados

### Lógica auxiliar (reutilizável)
```typescript
function isDueloEmAndamento(d: Duel): boolean {
  return d.status === "live" || 
    (d.status === "accepted" && new Date(d.start_at).getTime() <= Date.now());
}
```

## Resultado esperado
Assim que o horário de início do duelo chegar, ele aparece imediatamente como "Em andamento" na interface, sem precisar esperar o cron rodar.


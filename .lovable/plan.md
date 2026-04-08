

# Correção: Seção "Ao vivo na cidade" mostrando duelos agendados

## Problema
A seção **"Ao vivo na cidade"** está exibindo duelos com status `accepted` (badge "Agendado"), que ainda não começaram. Isso é confuso porque o título diz "Ao vivo" mas o card mostra "Agendado".

## Solução

Separar os duelos da cidade em duas categorias visuais:

1. **"Ao vivo na cidade"** — mostrar apenas duelos com `status === "live"` (realmente acontecendo agora)
2. **"Agendados na cidade"** — mostrar duelos com `status === "accepted"` que ainda não começaram, com título e ícone diferenciados (ex: ícone de relógio, cor neutra)

## Arquivo alterado
- `src/components/driver/duels/DuelsHub.tsx` — separar o `useMemo` de `duelosCidadeAoVivo` em dois arrays (ao vivo e agendados) e renderizar duas seções distintas

## Detalhes técnicos
- Filtro "Ao vivo": `d.status === "live"`
- Filtro "Agendados": `d.status === "accepted"`
- Ambos continuam excluindo duelos do próprio motorista (`!meusIds.has(d.id)`)
- O componente `CardDueloPublico` já renderiza corretamente os badges por status, então não precisa de alteração


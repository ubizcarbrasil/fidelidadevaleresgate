## Limpeza de temporadas fantasma do Campeonato

Migration atômica para cancelar 2 temporadas problemáticas em `campeonato_seasons`, sem deletar nada.

### Ações

1. **Cancelar "Julho 2026"** (`40bdf102-...`, branch `601882d7-...`)
   - Motivo: duplicata — branch já tem "Maio 2026" ativa
   - `cancelled_at = NOW()`, `cancellation_reason = 'Duplicata — temporada Maio 2026 já ativa no branch'`

2. **Cancelar "Abril 2026"** (`d0550dbf-...`, branch `e0469340-...`)
   - Motivo: `finished` sem membros, cron `prize_calculated` rodando em loop
   - `cancelled_at = NOW()`, `cancellation_reason = 'Temporada encerrada sem membros — cron prize_calculated em loop'`

3. **Guard `DO $$`**: levantar exceção se ainda houver branch com >1 temporada não-cancelada (rollback automático em caso de inconsistência).

4. **Verificação pós-migration**: `SELECT id, name, phase, cancelled_at, cancellation_reason` das 2 temporadas para confirmar.

### Pré-condição a validar antes de aplicar

A coluna `cancellation_reason` precisa existir em `public.campeonato_seasons`. Vou checar via `read_query` no momento da execução; se não existir, a migration adiciona a coluna (`ADD COLUMN IF NOT EXISTS cancellation_reason text`) antes dos UPDATEs.

### Escopo

- Apenas `UPDATE` (e possivelmente `ADD COLUMN IF NOT EXISTS`).
- Zero alteração de lógica de aplicação, edge functions ou frontend.
- "Maio 2026" (`ba585519-...`) intocada.

### Commit

`fix(campeonato): cancelar temporadas vazias — duplicata e finished sem membros`

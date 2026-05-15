## Diagnóstico

A constraint problemática **já não existe** no banco. A correção descrita já está aplicada (provavelmente em migration anterior).

**Estado atual de `campeonato_seasons`:**

```text
Índices únicos existentes:
- duelo_seasons_pkey                                       (id)
- campeonato_seasons_active_brand_branch_year_month_key    UNIQUE (brand_id, branch_id, year, month) WHERE cancelled_at IS NULL  ✅
```

Não existe nenhuma constraint `UNIQUE(brand_id, branch_id, year, month)` total. A `pg_constraint` retorna 0 linhas do tipo `u` na tabela — o índice parcial já é o único enforcement, exatamente como pedido.

**Verificação de duplicatas ativas:**

```sql
SELECT brand_id, branch_id, year, month, COUNT(*)
FROM campeonato_seasons WHERE cancelled_at IS NULL
GROUP BY 1,2,3,4 HAVING COUNT(*) > 1;
-- → 0 linhas
```

**Maio/2026 hoje (9 registros):** 6 cancelled + 3 ativas em **branches diferentes** (`601882d7…`, `aa1e7a2c…`, `ece001ed…`). Ou seja, novas temporadas foram criadas com sucesso após cancelamento — prova de que o índice parcial está funcionando.

## Conclusão

Nenhuma migration é necessária. O bug descrito já está corrigido. Rodar o `DROP CONSTRAINT IF EXISTS … _key` é seguro mas inerte (a constraint não existe), e o `CREATE UNIQUE INDEX IF NOT EXISTS idx_campeonato_seasons_unique_ativa` criaria um **índice duplicado** com nome diferente do já existente (`campeonato_seasons_active_brand_branch_year_month_key`).

## Frontend

As queries client-side em `FormCriarTemporadaAutomatico.tsx`, `FormCriarTemporadaAvancado.tsx` e `useCheckSeasonOverlap` já filtram `.is('cancelled_at', null)`. Nada a mudar.

## Recomendação

Não aplicar a migration. Se quiser, posso:

1. **Apenas padronizar o nome** do índice para `idx_campeonato_seasons_unique_ativa` (renomear o existente) — cosmético.
2. **Investigar o sintoma real** que motivou o pedido: se ainda aparece "já existe temporada Maio/2026" para algum branch, é provavelmente cache de React Query ou dados de outro branch — me diga qual cidade/branch está sendo afetada que eu reproduzo.
3. **Não fazer nada** — DB está correto.

Qual caminho prefere?

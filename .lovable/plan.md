## Causa
Após cancelar a temporada via `useCancelarTemporada`, o helper `invalidarTudo` em `src/products/campeonato/hooks/hook_mutations_campeonato.ts` invalida várias chaves (`empreendedor-seasons`, dashboards, etc.) mas **não invalida** `["check-season-conflict", ...]` nem `["check-season-overlap", ...]`. Resultado: o aviso "Já existe uma temporada para Maio/2026" continua visível mesmo com a temporada já cancelada (confirmado no banco — as 2 linhas de Maio/2026 têm `cancelled_at` preenchido).

## Correção
Em `hook_mutations_campeonato.ts`, adicionar a invalidação dessas duas chaves dentro de `invalidarTudo`:

```ts
qc.invalidateQueries({ queryKey: ["check-season-conflict"] });
qc.invalidateQueries({ queryKey: ["check-season-overlap"] });
```

Isso garante que, após qualquer cancelamento/criação/pausa, os avisos de conflito e sobreposição mostrados nos formulários (`FormCriarTemporada`, `FormCriarTemporadaAutomatico`, `EditorInformacoesBasicas`) sejam recalculados imediatamente.

## Fora de escopo
Nenhuma mudança de schema, RPC ou UI. Apenas 2 linhas adicionadas no helper de invalidação de cache.

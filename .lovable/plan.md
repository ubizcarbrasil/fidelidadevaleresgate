## Problema 1 — Zero não apaga nos inputs numéricos

Nos cards "Duração das fases do mata-mata" e "Prêmios da temporada", quando o usuário digita um valor, ele aparece concatenado ao zero existente (ex.: digita `48` e fica `048`; digita `100` e fica `0100`).

**Causa:** os `<Input type="number">` armazenam o valor como `number` no estado/form e renderizam sempre o número (ex.: `0`). Ao digitar, o cursor entra após o `0` e o valor passa a ser interpretado como string `"048"`. Como não há tratamento para limpar o zero inicial nem para deixar o campo vazio durante a edição, o usuário não consegue apagar.

**Correção (frontend, sem mudar lógica de negócio):**

1. `EditorFasesMataMata.tsx` — trocar o `Input` por uma versão controlada que:
   - Mantém valor local como `string` (permite vazio).
   - No `onChange`, remove zeros à esquerda e aceita string vazia.
   - No `onBlur`, normaliza para número (default 24 se vazio).
   - Adiciona `inputMode="numeric"` e `onFocus` que seleciona o conteúdo (`e.currentTarget.select()`) — assim ao tocar no campo já fica pronto pra sobrescrever.

2. `EditorPremios.tsx` — mesmo tratamento no `<Input type="number">` registrado via `form.register`. Substituir por `Controller` (ou um wrapper `InputNumero`) com a mesma lógica (string local, remove zeros à esquerda, `onFocus` seleciona tudo, `onBlur` converte).

3. Criar componente compartilhado `src/compartilhados/components/input_numero.tsx` para reuso (segue regra de componentização). Usar nos dois locais acima.

## Problema 2 — Resetar temporadas ativas para teste

Hoje existe **1 temporada ativa**: `Maio 2026` (Leme), `phase=classification`, já com `tier_seeding_completed_at` preenchido. O usuário quer começar do zero.

**Ação:** Migration que, para toda temporada com `phase NOT IN ('finished','cancelled') AND cancelled_at IS NULL`:
- Deleta `campeonato_season_standings` da temporada.
- Deleta `campeonato_tier_memberships` da temporada.
- Deleta `campeonato_brackets` / `campeonato_bracket_matches` se existirem.
- Marca `cancelled_at = now()` e `phase = 'cancelled'` (cancelamento lógico — preserva histórico da season).

Assim a tela de campeonato volta ao estado "sem temporada ativa" e o usuário pode criar uma nova do zero pra validar todo o fluxo (criação → distribuir motoristas → classificação).

## Arquivos afetados

- `src/compartilhados/components/input_numero.tsx` (novo)
- `src/products/campeonato/components/empreendedor/EditorFasesMataMata.tsx`
- `src/products/campeonato/components/empreendedor/EditorPremios.tsx`
- nova migration `cancelar_temporadas_ativas_para_reset`


# Tratar erro "temporada duplicada no mesmo mês" com mensagem clara e checagem prévia

## O que está acontecendo

O banco tem uma regra de unicidade: **só pode existir uma temporada por mês para cada cidade** (constraint `duelo_seasons_brand_id_branch_id_year_month_key`).

Quando você tenta criar uma temporada no mesmo Ano/Mês de outra que já existe (ativa, finalizada ou cancelada), o backend rejeita e o erro técnico aparece bruto na tela:

> `duplicate key value violates unique constraint "duelo_seasons_brand_id_branch_id_year_month_key"`

Ou seja, **não é um bug**, é uma regra de negócio que está sendo comunicada de forma ruim. E falta um aviso preventivo antes do clique em "Criar temporada".

## O que vou ajustar

### 1. Mensagem de erro amigável no submit
No `useCriarTemporadaCompleta` (mutation), interceptar o código de erro `23505` (violação de unique do Postgres) e exibir um toast claro em português:

> "Já existe uma temporada para **{Mês}/{Ano}** nesta cidade. Escolha outro mês ou cancele/exclua a temporada existente antes de criar uma nova."

Em vez do texto técnico atual.

### 2. Checagem prévia no formulário (preventivo)
No `EditorInformacoesBasicas.tsx`, ao escolher **Ano** e **Mês**, fazer uma consulta leve (`select id, name, status` em `duelo_seasons` filtrando por `brand_id`, `branch_id`, `year`, `month`).

Se já existir uma temporada nesse período, exibir um banner amarelo logo abaixo dos seletores:

> ⚠️ Já existe a temporada **"{nome}"** ({status}) em {Mês}/{Ano} nesta cidade. Para criar uma nova, escolha outro mês ou remova a existente em "Temporadas Anteriores".

E desabilitar o botão "Criar temporada" enquanto o conflito persistir, evitando o erro no submit.

### 3. Atalho para resolver o conflito
No mesmo banner, incluir um botão secundário **"Ver temporada existente"** que rola/abre a aba de temporadas anteriores, facilitando a resolução (cancelar/excluir antes de tentar de novo).

## Arquivos que serão ajustados

- `src/features/campeonato_duelo/hooks/hook_mutations_campeonato.ts`
  - tratar `error.code === "23505"` no `onError`, retornando mensagem amigável com Mês/Ano formatados
- `src/features/campeonato_duelo/components/empreendedor/EditorInformacoesBasicas.tsx`
  - adicionar `useQuery` que consulta `duelo_seasons` por `(brand_id, branch_id, year, month)`
  - exibir banner de conflito quando houver match
  - expor flag `temConflitoMesAno` via contexto/state para travar o submit
- `src/features/campeonato_duelo/components/empreendedor/FormCriarTemporada.tsx`
  - desabilitar o botão "Criar temporada" se a checagem prévia detectar conflito
  - exibir tooltip explicando o motivo do bloqueio

## Resultado esperado

- O usuário **percebe o conflito antes de clicar** em criar, ao escolher Ano/Mês.
- Se ainda assim tentar submeter (ou em race condition), recebe um toast em português claro, sem texto técnico de constraint.
- Caminho óbvio para resolver: trocar o mês ou ir para "Temporadas Anteriores" remover a existente.

## Detalhes técnicos

- Postgres devolve `code: "23505"` para violação de UNIQUE; o detail traz o nome da constraint. Vou casar pelo nome `duelo_seasons_brand_id_branch_id_year_month_key` para garantir que só essa constraint específica gere a mensagem de "mês duplicado" (outras unique constraints permanecem com mensagem genérica).
- A checagem prévia usa `maybeSingle()` e fica gated por `enabled: !!brandId && !!branchId && !!year && !!month` para evitar requisições desnecessárias.

## Risco e rollback

- **Risco baixo**: lógica concentrada em UX e tratamento de erro.
- **Rollback**: remover o `useQuery` de checagem e o handler específico do código 23505.


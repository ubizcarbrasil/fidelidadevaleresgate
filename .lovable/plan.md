

# Modo de pontuação configurável: confronto diário (V/E/D) na fase de classificação

## Diagnóstico

Hoje a pontuação da fase de classificação (`duelo_update_standings_from_ride`) **soma 1 ponto por corrida finalizada**. Não dá pra escolher outro modelo; tudo é "pontos corridos".

A demanda é poder escolher, por temporada, um segundo modo: **Confronto Diário (Round-robin diário)** — todos da série jogam contra todos no mesmo dia, e ao fim do dia cada motorista soma pontos por **vitória / empate / derrota** (configuráveis pelo empreendedor) com base na **quantidade de corridas finalizadas naquele dia**.

## Arquitetura

### 1) Backend — colunas novas em `duelo_seasons`

```sql
ALTER TABLE public.duelo_seasons
  ADD COLUMN scoring_mode text NOT NULL DEFAULT 'total_points'
    CHECK (scoring_mode IN ('total_points','daily_matchup')),
  ADD COLUMN scoring_config_json jsonb NOT NULL DEFAULT
    jsonb_build_object('win',3,'draw',1,'loss',0);
```

- `total_points`: comportamento atual (1 ponto por corrida).
- `daily_matchup`: novo modo. `scoring_config_json` = `{ win, draw, loss }`.

### 2) Backend — nova função `duelo_recalc_daily_matchup(p_season_id, p_day)`

`SECURITY DEFINER`, chamada por **cron diário** (1× por dia, 03:00 do fuso da branch) e pode ser executada manualmente pelo empreendedor pra reprocessar um dia.

Lógica:
1. Para cada **série** ativa da temporada.
2. Para cada par `(driver_a, driver_b)` da série, somar quantas corridas cada um finalizou em `[day 00:00, day 23:59:59]` no `branch_id` da temporada.
3. Se `rides_a > rides_b` → A vence (soma `win`), B perde (soma `loss`). Se `=` → ambos somam `draw`.
4. Aplicar o delta no `duelo_season_standings.points` (idempotente: armazena resumo do dia em `duelo_daily_matchup_log` para evitar dupla-contagem).

Tabela auxiliar:
```sql
CREATE TABLE duelo_daily_matchup_log (
  id uuid PK, season_id uuid, tier_id uuid, day date,
  driver_id uuid, rides int, wins int, draws int, losses int,
  points_awarded int, created_at timestamptz,
  UNIQUE(season_id, tier_id, driver_id, day)
);
```

Idempotência: se já existe linha para `(season, tier, driver, day)`, recalcula o delta e atualiza standings com a diferença.

### 3) Backend — adaptar `duelo_update_standings_from_ride`

No início, se `scoring_mode = 'daily_matchup'`, **não soma pontos por corrida** (apenas `weekend_rides_count` e `last_ride_at`). O cálculo de pontos passa a vir só do recalc diário.

### 4) Backend — cron job

Entrada via `pg_cron`:
```sql
SELECT cron.schedule('duelo_daily_matchup_recalc', '0 3 * * *',
  'SELECT public.duelo_recalc_all_daily_matchup_seasons();');
```

`duelo_recalc_all_daily_matchup_seasons()`: itera todas as seasons em `phase='classification'` com `scoring_mode='daily_matchup'` e chama `duelo_recalc_daily_matchup(season_id, ontem)`.

### 5) Frontend

#### a) Schema + serviço de criação (`schema_criar_temporada.ts` / `servico_campeonato_empreendedor.ts`)
- Adicionar `scoringMode: 'total_points' | 'daily_matchup'` e `scoringConfig: { win, draw, loss }` ao `CriarTemporadaCompletaInput`.
- Persistir na criação (`insert duelo_seasons`).

#### b) Novo bloco no `EditorInformacoesBasicas.tsx`
- Card **"Modo de pontuação da Classificação"** com 2 opções (RadioCards):
  - **Pontos corridos** (default): "+1 ponto por corrida finalizada".
  - **Confronto diário (round-robin)**: "Todos contra todos por dia. V/E/D configuráveis."
- Quando `daily_matchup` selecionado → 3 inputs numéricos: **Vitória**, **Empate**, **Derrota** (defaults 3/1/0).

#### c) Revisão (`RevisaoCriacao.tsx`) mostra o modo escolhido.

### 6) Pontos fora de escopo (decisões conscientes)

- Não vamos mudar o **modo de uma temporada já criada** — decidido na criação. (Mais simples, evita inconsistências de log).
- A regra "todos contra todos" considera **todos os membros atuais da série naquele dia**. Se motorista entrar/sair no meio, o cálculo do dia leva em conta quem estava na série às 23:59 daquele dia.
- Mata-mata segue **inalterado** (continua usando contagem de corridas no período do confronto).

## Arquivos a criar/editar

**Backend (1 migration):**
- Tabela `duelo_daily_matchup_log`, colunas `scoring_mode/scoring_config_json` em `duelo_seasons`, função `duelo_recalc_daily_matchup`, função `duelo_recalc_all_daily_matchup_seasons`, atualização do trigger `duelo_update_standings_from_ride`, cron job.

**Frontend:**
- `schemas/schema_criar_temporada.ts` (+ campos `scoringMode/scoringConfig`)
- `types/tipos_empreendedor.ts` (+ campos no `CriarTemporadaCompletaInput`)
- `services/servico_campeonato_empreendedor.ts` (persistir na insert)
- `constants/constantes_templates.ts` (default no template)
- `components/empreendedor/EditorInformacoesBasicas.tsx` (novo bloco)
- `components/empreendedor/RevisaoCriacao.tsx` (mostrar modo)
- `components/empreendedor/FormCriarTemporada.tsx` (passar valores iniciais)

## Risco

- **Baixo**: `scoring_mode` default `'total_points'` mantém comportamento atual. Trigger só desvia quando explicitamente `daily_matchup`. Recalc é idempotente.




# Sub-fase 7.0 — Configurações Avançadas do Duelo (Ciclo + Prêmios)

## O que já existe (não vamos refazer)

| Já pronto | Onde |
|---|---|
| Tabela `driver_duels` com `challenger_points_bet`, `challenged_points_bet`, `prize_points`, `points_reserved`, `season_id` | banco |
| Tabela `duel_side_bets` (apostas paralelas) | banco |
| Tabela `gamification_seasons` (temporadas/ciclos) | banco |
| Tabela `points_ledger` (fonte única de pontos) | banco |
| Página `/gamificacao-admin` com 6 abas (Configuração / Duelos / Apostas / Ranking / Cinturão / Moderação) | `GamificacaoAdminPage.tsx` |
| Aba "Configuração" com toggles de módulos, métricas, frases de recusa | `ConfiguracaoModulo.tsx` |
| Settings persistidos em `branches.branch_settings_json` | padrão da plataforma |
| RLS por brand/branch + `useBrandGuard` | padrão da plataforma |

**Conclusão**: não precisa criar tabelas novas para "duelo" e "aposta" — já existem. Vamos **adicionar 2 tabelas pequenas** (campanhas de prêmio + histórico de resets) e **estender a aba Configuração** com 4 sub-abas internas. Sem rota nova, sem submenu novo.

## O que vai ser construído

### 1. Refatorar a aba "Configuração" em sub-abas

Hoje é uma única tela longa. Vai virar abas internas (componentização extrema, padrão workspace):

```
Aba Configuração
 ├─ Geral          (o que já existe: toggles, métricas, frases)
 ├─ Limites de Aposta   ← NOVO
 ├─ Ciclo & Reset       ← NOVO
 ├─ Campanhas de Prêmio ← NOVO
 └─ Integração Corridas ← NOVO
```

Estrutura feature-based:
```
src/features/duelo_configuracoes/
 ├─ pagina_configuracoes_duelo.tsx          (orquestra as 5 sub-abas)
 ├─ components/
 │   ├─ aba_geral.tsx                       (move ConfiguracaoModulo atual)
 │   ├─ aba_limites_aposta.tsx
 │   ├─ aba_ciclo_reset.tsx
 │   ├─ aba_campanhas_premio.tsx
 │   ├─ aba_integracao_corridas.tsx
 │   ├─ card_campanha_premio.tsx
 │   ├─ formulario_campanha_premio.tsx
 │   ├─ preview_proximo_reset.tsx
 │   └─ historico_resets.tsx
 ├─ hooks/
 │   ├─ hook_config_duelo_avancada.ts       (load + save de branch_settings)
 │   ├─ hook_campanhas_premio.ts            (CRUD)
 │   ├─ hook_historico_resets.ts            (listagem)
 │   └─ hook_preview_reset.ts               (calcula motoristas elegíveis)
 ├─ services/
 │   └─ servico_campanhas_premio.ts
 ├─ schemas/
 │   ├─ schema_limites_aposta.ts            (zod)
 │   ├─ schema_ciclo_reset.ts
 │   └─ schema_campanha_premio.ts
 ├─ types/
 │   └─ tipos_configuracao_duelo.ts
 └─ constants/
     └─ constantes_configuracao_duelo.ts    (frequências, ações, etc.)
```

### 2. Banco — 2 tabelas novas + extensão de settings

#### 2.1 Settings (sem migração — já existe `branch_settings_json`)
Adicionar chaves novas em `branch_settings_json` (regra `=== true`, ausente = OFF):
- **Limites de aposta**: `duel_bet_max_individual`, `duel_bet_max_total`, `duel_bet_min_individual`
- **Ciclo**: `duel_cycle_reset_enabled`, `duel_cycle_frequency` (`daily`|`weekly`|`monthly`|`quarterly`), `duel_cycle_day` (1–31), `duel_cycle_action` (`zero_duel`|`zero_rides`|`zero_both`|`no_zero`), `duel_cycle_initial_points`, `duel_cycle_eligibility_json` (`{min_rides_prev_period: number, only_active: boolean}`)
- **Integração corridas**: `duel_count_ride_points` (bool), `duel_ride_points_factor` (decimal)

#### 2.2 Nova tabela `duel_prize_campaigns`
```
id uuid pk
brand_id uuid not null fk brands
branch_id uuid not null fk branches
season_id uuid nullable fk gamification_seasons
name text not null
description text
image_url text
points_cost integer not null check (>0)
quantity_total integer not null check (>0)
quantity_redeemed integer not null default 0
starts_at timestamptz not null
ends_at timestamptz not null
status text not null default 'active'  -- active|paused|ended
created_by uuid fk auth.users
created_at, updated_at timestamptz
```
RLS: brand_admin/root vê e edita por `brand_id`; branch_admin por `branch_id`; motorista lê apenas `status='active'` da própria cidade.

#### 2.3 Nova tabela `duel_cycle_reset_history`
```
id uuid pk
brand_id uuid not null
branch_id uuid not null
executed_at timestamptz not null default now()
drivers_affected integer not null
total_points_distributed bigint not null
action_executed text not null
config_snapshot jsonb not null   -- snapshot dos settings no momento
details_json jsonb               -- erros, ids ignorados, etc.
triggered_by text not null       -- 'cron'|'manual'
triggered_by_user uuid           -- nullable
```
RLS: leitura por brand/branch admin (auditoria, somente leitura via UI).

### 3. Edge Functions

#### 3.1 `reset-duelo-ciclo` (nova, agendada via pg_cron diário 00:05)
- Itera todas as `branches` com `duel_cycle_reset_enabled = true`
- Para cada uma: verifica se hoje é o dia de reset conforme `duel_cycle_frequency` + `duel_cycle_day`
- Se sim:
  - Lista motoristas elegíveis (filtra por `duel_cycle_eligibility_json`)
  - Aplica ação (`zero_duel`/`zero_rides`/`zero_both`/`no_zero`) via INSERT em `points_ledger` (débito de saldo atual, mantendo histórico — fonte única de verdade)
  - Credita `duel_cycle_initial_points` para cada elegível (INSERT em `points_ledger` tipo `CYCLE_BONUS`)
  - Insere registro em `duel_cycle_reset_history`
  - Dispara mensagens via `send-driver-message` (engine unificado já existe)
- Pagina em chunks de 500 motoristas (padrão da plataforma)
- Usa `SUPABASE_ANON_KEY` no header (padrão cron)

#### 3.2 `validar-aposta-duelo` (nova, chamada antes de criar duelo/side bet)
- Recebe `branch_id`, `points_individual`, `points_total`
- Lê limites de `branch_settings_json`
- Retorna `{ ok: true }` ou `{ ok: false, reason: string }`
- Validação JWT obrigatória
- **Backup defensivo**: trigger SQL `BEFORE INSERT` em `driver_duels` que rejeita se exceder limites (não confiar só no front)

#### 3.3 RPC `redeem_prize_campaign(campaign_id, driver_id)` (nova)
- Atômica com `FOR UPDATE` lock
- Valida saldo via `points_ledger`
- Decrementa `quantity_redeemed`
- Cria `points_ledger` débito tipo `PRIZE_REDEEM`
- Cria registro em `product_redemption_orders` (já existe, padrão da plataforma) vinculado por `campaign_id` em metadata
- Retorna `{ order_id, remaining_balance }`

### 4. UI — 4 sub-abas novas

#### Limites de Aposta
3 inputs numéricos (min individual, max individual, max total do duelo) + preview "Exemplo: motorista A aposta 500 + motorista B aposta 500 = 1.000 (dentro do limite de X)"

#### Ciclo & Reset
- Toggle principal "Ativar reset automático"
- Select frequência (diário/semanal/mensal/trimestral)
- Input dia (1-31, com validação contextual — se mensal, 1-28 recomendado)
- RadioGroup ação (4 opções com explicação curta cada)
- Input pontos iniciais
- Bloco "Quem recebe": checkbox "Apenas ativos" + input "Mín. corridas no período anterior"
- **Componente `PreviewProximoReset`**: cálculo em tempo real "No próximo dia 01/05/2026, **47 motoristas** receberão **1.000 pontos** cada — total **47.000 pontos** distribuídos. Saldo atual de duelos será **zerado**."
- Botão "Executar reset agora" (manual, com confirmação dupla)
- Tabela "Histórico dos últimos 10 resets"

#### Campanhas de Prêmio
- Botão "Nova Campanha" → abre `formulario_campanha_premio` (Sheet)
- Grid de cards `CardCampanhaPremio` com: imagem, nome, custo, qtd disponível/resgatada, status badge, datas, ações (editar/pausar/encerrar)
- Filtro por status

#### Integração Corridas
- Toggle "Pontos de corrida somam no saldo de duelo"
- Input "Fator de conversão" (1 corrida = X pontos), aparece só se toggle ativo
- Explicação inline do efeito

### 5. Segurança (checklist obrigatório)

- [x] RLS em `duel_prize_campaigns` (brand/branch isolation)
- [x] RLS em `duel_cycle_reset_history` (read-only para admins)
- [x] Trigger SQL valida limites no INSERT/UPDATE de `driver_duels` e `duel_side_bets`
- [x] Edge functions validam JWT via `getClaims()`
- [x] RPC `redeem_prize_campaign` é `SECURITY DEFINER` com lock `FOR UPDATE`
- [x] Auditoria: cada save de configuração registra `created_by` + `updated_at` (já temos colunas, basta gravar)
- [x] Server-side enforcement (nunca confiar só no front)

## Arquivos editados/criados

| Arquivo | Ação |
|---|---|
| `src/features/duelo_configuracoes/...` (15 arquivos novos) | criar feature completa |
| `src/pages/GamificacaoAdminPage.tsx` | trocar `<ConfiguracaoModulo>` por `<PaginaConfiguracoesDuelo>` |
| `src/components/admin/gamificacao/ConfiguracaoModulo.tsx` | mover conteúdo para `aba_geral.tsx`, deletar |
| `src/components/driver/duels/hook_config_duelos.ts` | adicionar leitura das novas flags (limites, ciclo, integração) |
| `src/lib/queryKeys.ts` | adicionar `dueloConfig`, `dueloCampanhas`, `dueloResetHistory` |
| `supabase/functions/reset-duelo-ciclo/index.ts` | nova |
| `supabase/functions/validar-aposta-duelo/index.ts` | nova |
| migração SQL | 2 tabelas + RLS + trigger validação + RPC + cron job |

## Riscos e rollback

- **Risco baixo**: features novas isoladas; sub-aba "Geral" preserva 100% do comportamento atual; ciclo de reset só roda se `duel_cycle_reset_enabled === true` (default OFF)
- **Defensivo**: trigger de validação e RPC atômica garantem integridade mesmo sem UI
- **Rollback**: reverter migração drop das 2 tabelas novas + remover chaves novas do `branch_settings_json` (idempotente)

## O que NÃO entra

- Refatoração das tabelas atuais de duelo (já estão maduras)
- Mudanças no fluxo de criação/aceite de duelo do motorista (apenas validação extra silenciosa)
- Editor visual r


## Etapa 8 — Escalabilidade Futura do Módulo de Gamificação

### Resumo
Preparar a arquitetura do módulo para expansão futura sem implementar funcionalidades completas agora. O trabalho consiste em: (1) criar tipos e interfaces extensíveis, (2) adicionar campos reservados no banco, (3) expandir o EventBus com eventos futuros, (4) criar um registro central de funcionalidades futuras com feature flags.

Nenhuma tela nova será criada agora — apenas a fundação técnica para que cada funcionalidade futura possa ser implementada de forma incremental e isolada.

---

### 1. Banco de dados — Campos e tabelas preparatórias

**Migration SQL com:**

**Novos campos em `driver_duels`:**
- `duel_mode text NOT NULL DEFAULT 'rides'` — permite futuramente `'points'`, `'team'`
- `season_id uuid NULL` — referência futura a temporadas
- `is_rematch boolean DEFAULT false` — flag de revanche
- `rematch_of uuid NULL REFERENCES driver_duels(id)` — link ao duelo original
- `prize_points integer DEFAULT 0` — premiação em pontos para o vencedor

**Nova tabela `gamification_seasons`:**
```sql
CREATE TABLE public.gamification_seasons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id uuid NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  brand_id uuid NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  name text NOT NULL,
  start_at timestamptz NOT NULL,
  end_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'upcoming', -- upcoming, active, finished
  config_json jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.gamification_seasons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view seasons" ON public.gamification_seasons FOR SELECT TO anon, authenticated USING (true);
```

**Nova tabela `driver_achievements`:**
```sql
CREATE TABLE public.driver_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  branch_id uuid NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  brand_id uuid NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  achievement_key text NOT NULL,
  achievement_label text NOT NULL,
  icon_name text DEFAULT 'Trophy',
  achieved_at timestamptz NOT NULL DEFAULT now(),
  metadata_json jsonb DEFAULT '{}',
  UNIQUE (customer_id, achievement_key)
);
ALTER TABLE public.driver_achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view achievements" ON public.driver_achievements FOR SELECT TO anon, authenticated USING (true);
```

**Nova tabela `city_feed_events`:**
```sql
CREATE TABLE public.city_feed_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id uuid NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  brand_id uuid NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  metadata_json jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.city_feed_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view feed" ON public.city_feed_events FOR SELECT TO anon, authenticated USING (true);
```
Realtime habilitado para `city_feed_events`.

Trigger de validação para `gamification_seasons.status` (apenas `upcoming`, `active`, `finished`).

---

### 2. Tipos e constantes de extensibilidade

**Novo arquivo: `src/components/driver/duels/tipos_gamificacao_futura.ts`**

Interfaces TypeScript preparatórias:
- `DuelMode`: `'rides' | 'points' | 'team'`
- `SeasonConfig`: estrutura de temporada
- `Achievement`: medalha/conquista do motorista
- `FeedEvent`: evento do feed competitivo
- `ProvocacaoAutomatica`: estrutura para provocações leves
- `RankingPeriodo`: `'weekly' | 'monthly' | 'all_time'`

**Novo arquivo: `src/components/driver/duels/constantes_conquistas.ts`**

Catálogo de conquistas futuras com chaves pré-definidas:
- `first_duel_win` — Primeira vitória
- `five_wins_streak` — 5 vitórias seguidas
- `belt_holder` — Conquistou o cinturão
- `top1_ranking` — Primeiro lugar no ranking
- `rematch_winner` — Venceu a revanche
- `season_champion` — Campeão da temporada

Cada entrada com: `key`, `label`, `description`, `iconName`.

---

### 3. Novos eventos no EventBus

**Arquivo modificado: `src/lib/eventBus.ts`**

Adicionar eventos preparatórios:
```ts
SEASON_STARTED: { brandId: string; branchId: string; seasonId: string; seasonName: string };
SEASON_ENDED: { brandId: string; branchId: string; seasonId: string };
ACHIEVEMENT_UNLOCKED: { brandId: string; customerId: string; achievementKey: string };
FEED_EVENT_CREATED: { brandId: string; branchId: string; eventType: string };
DUEL_REMATCH_REQUESTED: { brandId: string; duelId: string; originalDuelId: string };
DUEL_PRIZE_AWARDED: { brandId: string; customerId: string; points: number; duelId: string };
```

---

### 4. Configuração expandida

**Arquivo modificado: `src/components/driver/duels/hook_config_duelos.ts`**

Expandir `ConfigDuelos` com novos campos (todos default `false`/`'rides'`):
- `modosDuelo: string[]` — modos habilitados (`['rides']`)
- `revanchaHabilitada: boolean`
- `temporadasAtivas: boolean`
- `conquistasAtivas: boolean`
- `feedCompetitivo: boolean`
- `provocacoesAutomaticas: boolean`
- `rankingPeriodos: string[]` — `['monthly']`
- `premiacaoPontos: boolean`

---

### 5. Serviço de feed competitivo (stub)

**Novo arquivo: `src/components/driver/duels/servico_feed_cidade.ts`**

Função `registrarEventoFeed` que insere na tabela `city_feed_events`. Será chamada futuramente pelos hooks de duelos, ranking e cinturão quando ações relevantes acontecerem (vitória, novo campeão, entrada no top 10, etc.).

---

### 6. Hook de conquistas (stub)

**Novo arquivo: `src/components/driver/duels/hook_conquistas.ts`**

Hook `useConquistasMotorista(customerId)` que busca conquistas do motorista na tabela `driver_achievements`. Preparado para ser montado em telas futuras de perfil/medalhas.

---

### Arquivos envolvidos
```
Migration SQL (novas tabelas + campos)
src/components/driver/duels/tipos_gamificacao_futura.ts (novo)
src/components/driver/duels/constantes_conquistas.ts (novo)
src/components/driver/duels/servico_feed_cidade.ts (novo)
src/components/driver/duels/hook_conquistas.ts (novo)
src/lib/eventBus.ts (modificado)
src/components/driver/duels/hook_config_duelos.ts (modificado)
```

### Notas
- Nenhuma tela nova — apenas infraestrutura extensível
- Todas as novas tabelas têm RLS de leitura pública (dados competitivos)
- Os campos novos em `driver_duels` têm defaults, sem quebrar duelos existentes
- Feature flags em `branch_settings_json` permitem ativação granular por cidade no futuro


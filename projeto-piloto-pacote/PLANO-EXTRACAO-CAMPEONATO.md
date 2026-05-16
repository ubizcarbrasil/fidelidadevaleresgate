# Plano — Extração do Produto Campeonato para Novo Projeto SaaS Isolado

## Contexto

O projeto atual `fidelidadevaleresgate` é um monolito que combina vários produtos: fidelidade/resgate de cliente, CRM, motorista, achadinhos, e **campeonato de motoristas**. Você quer extrair APENAS o produto **Campeonato** (com fluxo de motorista, sem cliente) para um novo projeto SaaS isolado, mantendo as características chave:

- **Multi-marca + multi-cidade** (cada marca tem várias cidades; cada cidade define sua temporada independente)
- **Integração via API** que recebe corridas externas (TaxiMachine ou similar) e atualiza pontuação em tempo real
- **Apenas motorista** (não passageiro/cliente)
- **Onboarding independente** — o novo SaaS cadastra suas próprias marcas, cidades, motoristas e chaves API (sem compartilhar banco com o projeto atual)
- **Stack idêntica** — Lovable + Vite + React + TS + Tailwind + shadcn + Supabase (maximiza reuso de código)

O resultado é um app dedicado, mais leve, com escopo claro e bundle menor — sem o peso do CRM/cliente/achadinhos do projeto pai.

---

## Visão geral da arquitetura do novo projeto

```
┌─────────────────────────────────────────────────────────────┐
│                  NOVO PROJETO (SaaS Campeonato)            │
│                                                             │
│  ┌──────────────────────┐    ┌──────────────────────────┐  │
│  │  Painel Empreendedor │    │   Painel Motorista       │  │
│  │  (admin de cidade)   │    │   (CPF login)            │  │
│  │                      │    │                          │  │
│  │  - Criar temporada   │    │  - Tabela de duelos      │  │
│  │  - Configurar séries │    │  - Classificação         │  │
│  │  - Distribuir motor. │    │  - Chaveamento mata-mata │  │
│  │  - Aprovar inscriç.  │    │  - Artilharia (recordes) │  │
│  │  - Ajustar prêmios   │    │  - Próximos campeonatos  │  │
│  │  - Cancelar temp.    │    │  - Notificações          │  │
│  └──────────┬───────────┘    └────────────┬─────────────┘  │
│             │                              │                │
│             └─────────────┬────────────────┘                │
│                           │                                 │
│                ┌──────────▼──────────┐                      │
│                │  Supabase (NOVO DB) │                      │
│                │                     │                      │
│                │  - brands           │                      │
│                │  - branches (city)  │                      │
│                │  - customers (driv) │                      │
│                │  - driver_profiles  │                      │
│                │  - machine_integr.  │                      │
│                │  - machine_rides    │                      │
│                │  - campeonato_*     │                      │
│                │                     │                      │
│                │  RPCs + Triggers    │                      │
│                │  + Realtime         │                      │
│                └─────────┬───────────┘                      │
│                          │                                  │
└──────────────────────────┼──────────────────────────────────┘
                           │
                           │ HTTPS
                           ▼
              ┌────────────────────────┐
              │  Edge Function:        │
              │  machine-webhook       │
              │                        │
              │  POST /machine-webhook │
              │  Headers: x-api-key    │
              │  Body: { ride_data }   │
              └────────────┬───────────┘
                           │
                           │
                  ┌────────▼────────┐
                  │  Sistema        │
                  │  externo de     │
                  │  corridas       │
                  │  (TaxiMachine)  │
                  └─────────────────┘
```

---

## Decisões já tomadas

| Decisão | Valor |
|---|---|
| Stack frontend | Lovable + Vite + React + TS + Tailwind + shadcn |
| Backend / DB | **Supabase próprio (NÃO o auto-provisionado pelo Lovable)** — você cria o projeto direto em supabase.com e conecta ao Lovable via env vars |
| Onboarding | Independente (DB próprio, cadastros próprios) |
| Auth motorista | CPF-only via localStorage (sem `auth.users`) — igual ao atual |
| Auth admin | `auth.users` (Supabase Auth) + role `brand_admin` |
| Multi-tenancy | RLS por `brand_id` + `branch_id` em todas as tabelas |
| Recebimento de corridas | Edge function `machine-webhook` com API key por cidade |
| Realtime | Supabase Realtime (postgres_changes) nas tabelas de standings/brackets |
| Gestão de migrations | **Você gerencia direto no seu Supabase** (CLI ou dashboard), não via Lovable |
| Deploy edge functions | **Via Supabase CLI** (`supabase functions deploy`), não via Lovable |

---

## Passo a passo de criação

### Passo 0 — Pré-requisitos

- Conta no Lovable
- Acesso ao projeto atual `fidelidadevaleresgate` (pra copiar código)
- Acesso ao GitHub `ubizcarbrasil`

---

### Passo 1 — Criar Supabase próprio + projeto Lovable conectado

**ORDEM IMPORTANTE: criar Supabase ANTES do Lovable.**

#### 1.1. Criar projeto Supabase próprio (manual)

1. Acessar https://supabase.com → "New Project"
2. Nome: `campeonato-motoristas`
3. Region: `South America (São Paulo)` — menor latência pra Brasil
4. Plano: Free pra começar (depois upgrade conforme tráfego)
5. Aguardar provisionamento (~2 min)
6. Anotar:
   - **Project URL** (ex: `https://abc123.supabase.co`)
   - **anon/public key** (Settings → API)
   - **service_role key** (NUNCA expor no frontend; só pra edge functions)
   - **Database URL** (Settings → Database → Connection string)
7. Habilitar Realtime nas tabelas que vão precisar (vide Passo 2.9)

#### 1.2. Instalar Supabase CLI local

```bash
# macOS
brew install supabase/tap/supabase

# Linux
npm install -g supabase
```

Login + link ao projeto:
```bash
supabase login
supabase link --project-ref abc123  # do URL do seu projeto
```

#### 1.3. Criar projeto Lovable

1. Lovable → New Project → React + Vite + TypeScript
2. Nome: `campeonato-motoristas`
3. **NÃO** conectar ao Supabase auto-provisionado (ou desconectar depois)
4. Confirmar repositório GitHub criado: `ubizcarbrasil/campeonato-motoristas`

#### 1.4. Conectar Lovable ao seu Supabase

Em Lovable → Project Settings → Environment Variables, adicionar:
```
VITE_SUPABASE_URL=https://abc123.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJh...  (anon key)
```

> **Nota:** se Lovable tiver criado um Supabase automático, você pode deixar inativo ou deletar. As env vars que valem são as que VOCÊ configurou.

**Stack que vem do template Lovable já inclui:**
- Vite + React 18 + TypeScript
- Tailwind + shadcn/ui
- React Router
- TanStack React Query
- Supabase client (`@supabase/supabase-js`)

---

### Passo 2 — Schema do banco (Supabase migrations)

#### Fluxo de migrations no SEU Supabase

Como o banco é seu (não auto-gerenciado pelo Lovable), você tem 2 caminhos:

**Caminho A: CLI local (recomendado pra controle de versão)**
```bash
# Criar nova migration
supabase migration new create_brands_branches

# Editar o SQL gerado em supabase/migrations/<timestamp>_create_brands_branches.sql
# Aplicar localmente (opcional, se rodar Supabase local)
supabase db reset

# Aplicar no remoto
supabase db push
```

**Caminho B: Dashboard Supabase (mais simples, sem CLI)**
- Acessar Supabase → SQL Editor
- Colar o SQL, executar
- Salvar como "Saved Snippet" pra histórico

Ambos funcionam. Recomendação: usar CLI desde o início pra ter histórico no git.

Criar as migrations na ordem abaixo. Todas em `supabase/migrations/` do repo.

#### 2.1. Tabelas base (multi-tenancy)

```sql
-- brands: marcas/franquias clientes do SaaS
CREATE TABLE public.brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  is_active BOOLEAN DEFAULT true,
  subscription_status TEXT DEFAULT 'TRIAL',
  trial_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- branches: cidades operadas por cada marca
CREATE TABLE public.branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT,
  city TEXT,
  state TEXT,
  is_active BOOLEAN DEFAULT true,
  scoring_model TEXT DEFAULT 'DRIVER_ONLY',  -- compat com campeonato
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- user_roles: admins do SaaS (root + brand_admin)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('root_admin', 'brand_admin', 'branch_admin')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, brand_id, role)
);
```

#### 2.2. Tabelas de motoristas

```sql
-- customers: motoristas (renomear futuramente pra "drivers" se quiser)
-- Mantém o nome "customers" pra reuso máximo do código fonte
CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  cpf TEXT,
  phone TEXT,
  email TEXT,
  photo_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX customers_brand_branch_idx ON customers(brand_id, branch_id);
CREATE INDEX customers_cpf_idx ON customers(cpf) WHERE cpf IS NOT NULL;

-- driver_profiles: perfil estendido (foto fallback, dados extras)
CREATE TABLE public.driver_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  photo_url TEXT,
  cnh TEXT,
  vehicle_plate TEXT,
  bank_data_json JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (customer_id)
);
```

#### 2.3. Integração de corridas

```sql
-- machine_integrations: credenciais API por cidade
CREATE TABLE public.machine_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
  api_key TEXT NOT NULL UNIQUE,
  basic_auth_user TEXT,
  basic_auth_password TEXT,
  is_active BOOLEAN DEFAULT true,
  webhook_registered BOOLEAN DEFAULT false,
  total_rides INTEGER DEFAULT 0,
  last_ride_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- machine_rides: corridas recebidas via webhook
CREATE TABLE public.machine_rides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id),
  branch_id UUID REFERENCES branches(id),
  machine_ride_id TEXT NOT NULL,
  driver_customer_id UUID REFERENCES customers(id),
  driver_name TEXT,
  driver_id TEXT,
  ride_value NUMERIC,
  ride_status TEXT CHECK (ride_status IN ('PENDING','IN_PROGRESS','FINALIZED','CANCELLED','CREDENTIAL_ERROR','API_ERROR')),
  finalized_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (brand_id, machine_ride_id)
);
CREATE INDEX machine_rides_driver_finalized_idx ON machine_rides(driver_customer_id, finalized_at);

-- machine_ride_events: log raw de cada evento recebido
CREATE TABLE public.machine_ride_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID,
  branch_id UUID,
  raw_payload JSONB NOT NULL,
  status_code TEXT,
  processed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### 2.4. Tabelas core do campeonato

**Copiar diretamente** das migrations do projeto atual (a partir de `supabase/migrations/20260421194253_*.sql` em diante, filtrar só as relevantes). Tabelas essenciais:

```sql
campeonato_seasons              -- temporadas (brand_id, branch_id, year, month, phase, ...)
campeonato_season_tiers         -- séries A/B/C/D (size, promote_count, ...)
campeonato_tier_memberships     -- motorista → tier
campeonato_season_enrollments   -- inscrições (auto/manual)
campeonato_season_standings     -- classificação (points, last_ride_at)
campeonato_brackets             -- chaveamento (driver_a/b_id, rides, winner)
campeonato_match_events         -- eventos por duelo
campeonato_artilharia_window_prizes  -- prêmios artilharia
campeonato_attempts_log         -- log de tentativas
campeonato_prize_distributions  -- distribuição prêmios
brand_duelo_prizes              -- prêmios por (tier, position)
```

**IMPORTANTE — usar nomes finais já corretos:**
- Não usar `duelo_*` (legado renomeado pra `campeonato_*`). Migration deve criar direto com nome final.
- UNIQUE index parcial em `campeonato_seasons (brand_id, branch_id, year, month) WHERE cancelled_at IS NULL` desde o início (evita o bug que tivemos).

#### 2.5. RLS policies

Habilitar RLS em todas as tabelas + criar policies:

```sql
-- Helper function: admin pode gerenciar esta brand?
CREATE OR REPLACE FUNCTION public.campeonato_admin_can_manage(p_brand_id UUID)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND (
        role = 'root_admin'
        OR (role = 'brand_admin' AND brand_id = p_brand_id)
      )
  );
$$;

-- Policy padrão para tabelas campeonato_*:
CREATE POLICY "campeonato_admin_select" ON public.campeonato_seasons
  FOR SELECT USING (public.campeonato_admin_can_manage(brand_id));
-- (replicar pra UPDATE/DELETE/INSERT)
```

#### 2.6. Triggers de pontuação

```sql
CREATE OR REPLACE FUNCTION public.campeonato_update_standings_from_ride()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_season_id UUID;
  v_tier_id UUID;
BEGIN
  IF NEW.ride_status != 'FINALIZED' THEN RETURN NEW; END IF;
  IF OLD.ride_status = 'FINALIZED' THEN RETURN NEW; END IF;
  IF NEW.driver_customer_id IS NULL THEN RETURN NEW; END IF;

  -- Busca temporada ativa pra brand+branch+data
  SELECT id INTO v_season_id FROM campeonato_seasons
  WHERE brand_id = NEW.brand_id
    AND branch_id = NEW.branch_id
    AND phase = 'classification'
    AND NEW.finalized_at BETWEEN classification_starts_at AND classification_ends_at
    AND cancelled_at IS NULL
  LIMIT 1;

  IF v_season_id IS NULL THEN RETURN NEW; END IF;

  SELECT tier_id INTO v_tier_id FROM campeonato_tier_memberships
  WHERE season_id = v_season_id AND driver_id = NEW.driver_customer_id;

  IF v_tier_id IS NULL THEN RETURN NEW; END IF;

  INSERT INTO campeonato_season_standings
    (season_id, driver_id, tier_id, points, last_ride_at)
  VALUES (v_season_id, NEW.driver_customer_id, v_tier_id, 1, NEW.finalized_at)
  ON CONFLICT (season_id, driver_id)
  DO UPDATE SET
    points = campeonato_season_standings.points + 1,
    last_ride_at = GREATEST(campeonato_season_standings.last_ride_at, EXCLUDED.last_ride_at);

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_campeonato_standings_from_ride
  AFTER INSERT OR UPDATE OF ride_status, finalized_at ON public.machine_rides
  FOR EACH ROW EXECUTE FUNCTION public.campeonato_update_standings_from_ride();

-- Trigger similar pra brackets (mata-mata)
CREATE TRIGGER trg_campeonato_bracket_rides
  AFTER INSERT OR UPDATE OF ride_status, finalized_at ON public.machine_rides
  FOR EACH ROW EXECUTE FUNCTION public.campeonato_update_bracket_from_ride();
```

#### 2.7. RPCs essenciais

**Empreendedor (admin):**
- `brand_get_seasons_list(p_brand_id, p_branch_id, p_status)` ← **incluir branchId desde o início** (evita o bug que tivemos)
- `brand_get_season_summary(p_season_id)`
- `brand_get_series_detail(p_season_id, p_tier_id)`
- `brand_get_drivers_available(p_brand_id, p_branch_id)`
- `brand_get_brackets_full(p_season_id)`
- `campeonato_cancel_season(p_season_id, p_reason)`
- `campeonato_pause_season(p_season_id)`
- `campeonato_resume_season(p_season_id)`
- `campeonato_advance_phases()` (cron)
- `campeonato_materialize_and_seed_season(p_season_id)`

**Motorista:**
- `lookup_driver_by_cpf(p_brand_id, p_cpf)`
- `driver_enroll_season(p_season_id)` (valida foto, vagas, janela)
- `driver_get_current_match(p_driver_id)`
- `driver_get_bracket_v2(p_season_id, p_tier_id, p_driver_id)`
- `driver_get_tier_standings_v2(p_season_id, p_tier_id, p_driver_id)`
- `driver_get_top_riders(p_season_id, p_window)`
- `driver_list_tier_rounds(p_season_id, p_tier_id, p_driver_id)`
- `driver_list_tier_round_matches(...)`
- `driver_get_notifications(p_driver_id)`

#### 2.8. Storage bucket

```sql
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
-- Policy: motorista pode upload sua própria foto via edge function
```

---

### Passo 3 — Edge Functions

Criar em `supabase/functions/` (no repo do Lovable, mas deploy via Supabase CLI).

#### 3.1. `machine-webhook` (recebe corridas)

Copiar de `/home/user/fidelidadevaleresgate/supabase/functions/machine-webhook/index.ts` (1200 linhas).

Adaptações:
- Remover lógica de cliente/passageiro (cliente não existe no novo projeto)
- Remover `credit_customer_points` (apenas registrar a corrida; o trigger cuida do scoring)
- Manter validação de API key, rate limit, log raw

#### 3.2. `driver-upload-photo`

Para upload da foto do motorista sem auth.users:
- Validar CPF + brand_id no body
- Verificar se motorista existe naquela brand
- Upload no bucket `avatars`
- Atualizar `customers.photo_url` + `driver_profiles.photo_url`

#### 3.3. `campeonato-cron-advance` (cron job)

Executa periodicamente:
- Chama `campeonato_advance_phases()` (transição de fase)
- Chama `campeonato_reconcile_standings()` (auditoria)

#### Deploy das edge functions

Como Lovable NÃO faz deploy de edge functions pro seu Supabase próprio, você faz manualmente:

```bash
# Definir secrets necessárias (uma vez)
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<service_role>

# Deploy cada função
supabase functions deploy machine-webhook --project-ref abc123
supabase functions deploy driver-upload-photo --project-ref abc123
supabase functions deploy campeonato-cron-advance --project-ref abc123
```

#### Cron jobs (pg_cron)

Para o `campeonato-cron-advance` rodar periodicamente:

```sql
-- Habilitar extensão pg_cron (Supabase Dashboard → Extensions)
-- Agendar a função pra rodar a cada 5 minutos
SELECT cron.schedule(
  'campeonato-advance-phases',
  '*/5 * * * *',
  $$
    SELECT net.http_post(
      url := 'https://abc123.supabase.co/functions/v1/campeonato-cron-advance',
      headers := jsonb_build_object('Authorization', 'Bearer ' || current_setting('app.service_role_key'))
    );
  $$
);
```

---

### Passo 4 — Estrutura de pastas do novo projeto

```
campeonato-motoristas/
├── src/
│   ├── App.tsx                       # Routes principais
│   ├── main.tsx                      # Entry point
│   ├── index.css
│   │
│   ├── components/
│   │   ├── ui/                       # shadcn (copiar do projeto atual)
│   │   ├── empreendedor/             # = campeonato/components/empreendedor/
│   │   ├── motorista/                # = campeonato/components/motorista/
│   │   ├── notificacoes/             # = campeonato/components/notificacoes/
│   │   ├── shared/                   # = campeonato/components/shared/
│   │   ├── AppLayout.tsx
│   │   ├── ErrorBoundary.tsx
│   │   ├── ProtectedRoute.tsx
│   │   └── DriverCpfLogin.tsx        # = src/components/driver/DriverCpfLogin.tsx
│   │
│   ├── contexts/
│   │   ├── AuthContext.tsx           # auth admin (Supabase Auth)
│   │   ├── BrandContext.tsx          # brand resolve (subdomain/?brandId)
│   │   └── DriverSessionContext.tsx  # = src/contexts/DriverSessionContext.tsx
│   │
│   ├── hooks/
│   │   ├── useBrandGuard.ts          # = src/hooks/useBrandGuard.ts (simplificar)
│   │   ├── useBrandTheme.ts          # = src/hooks/useBrandTheme.ts
│   │   └── use-mobile.ts
│   │
│   ├── lib/
│   │   ├── utils.ts                  # cn helper
│   │   ├── queryClient.ts            # = src/lib/queryClient.ts
│   │   ├── queryKeys.ts              # factory (só com chaves do campeonato)
│   │   ├── lazyWithRetry.ts          # = src/lib/lazyWithRetry.ts
│   │   ├── pwaRecovery.ts            # = src/lib/pwaRecovery.ts
│   │   ├── errorTracker.ts           # = src/lib/errorTracker.ts
│   │   └── auditLogger.ts            # = src/lib/auditLogger.ts
│   │
│   ├── integrations/
│   │   └── supabase/
│   │       ├── client.ts             # apontar pro novo Supabase
│   │       └── types.ts              # gerado por `supabase gen types`
│   │
│   ├── pages/
│   │   ├── Auth.tsx                  # login admin
│   │   ├── BrandsAdmin.tsx           # CRUD de brands (root_admin)
│   │   ├── BranchesAdmin.tsx         # CRUD de branches por brand
│   │   ├── DriversAdmin.tsx          # CRUD de motoristas por branch
│   │   ├── ApiIntegrationsPage.tsx   # gerar/listar API keys
│   │   ├── CampeonatoEmpreendedorPage.tsx  # painel admin do campeonato
│   │   └── DriverPanelPage.tsx       # painel motorista (rota /driver)
│   │
│   ├── features/                     # extra features compartilhadas
│   │   └── campeonato/               # = src/products/campeonato/* (TODO o módulo)
│   │       ├── pages/
│   │       ├── components/
│   │       ├── hooks/
│   │       ├── services/
│   │       ├── types/
│   │       ├── utils/
│   │       ├── constants/
│   │       └── schemas/
│   │
│   └── compartilhados/
│       ├── components/
│       │   ├── tela_carregamento.tsx
│       │   └── input_numero.tsx
│       └── constants/
│
├── supabase/
│   ├── migrations/                   # schema completo + RLS + RPCs
│   └── functions/
│       ├── machine-webhook/
│       ├── driver-upload-photo/
│       └── campeonato-cron-advance/
│
├── public/
├── index.html
├── vite.config.ts                    # com manualChunks granular (PR #3)
└── package.json
```

---

### Passo 5 — O que copiar do projeto atual (lista cirúrgica)

#### Copiar 1:1 (sem mudança):
- **Toda a pasta** `src/products/campeonato/` → `src/features/campeonato/`
- **shadcn UI components** que o campeonato usa (badge, button, card, dialog, etc.)
- `src/lib/lazyWithRetry.ts`, `src/lib/pwaRecovery.ts`, `src/lib/errorTracker.ts`, `src/lib/auditLogger.ts`, `src/lib/queryClient.ts`
- `src/contexts/DriverSessionContext.tsx`
- `src/components/driver/DriverCpfLogin.tsx`
- `src/compartilhados/components/tela_carregamento.tsx`
- `src/compartilhados/components/input_numero.tsx`
- `src/hooks/use-mobile.ts`
- `index.html` (com bootstrap loader inline + preconnect)
- `vite.config.ts` (com manualChunks dos PRs anteriores)

#### Copiar e simplificar:
- `src/contexts/AuthContext.tsx` → manter Supabase Auth (admin) mas remover lógica de roles complexas
- `src/contexts/BrandContext.tsx` → manter resolução por subdomain/param, simplificar (sem white-label complexo)
- `src/hooks/useBrandGuard.ts` → simplificar (só `root_admin` vs `brand_admin` vs `branch_admin`)
- `src/hooks/useBrandTheme.ts` → opcional (manter pra customização visual por marca)
- `src/lib/queryKeys.ts` → criar do zero APENAS com as chaves usadas pelo campeonato

#### Recriar do zero (simpler):
- `src/App.tsx` → router enxuto (5-10 rotas, não 153)
- `src/components/AppLayout.tsx` → sidebar simples com: Marcas (root), Cidades, Motoristas, API Keys, Campeonato
- `src/pages/Auth.tsx` → login admin com email/senha
- `src/pages/BrandsAdmin.tsx`, `BranchesAdmin.tsx`, `DriversAdmin.tsx`, `ApiIntegrationsPage.tsx`

---

### Passo 6 — Adaptações no código copiado

#### 6.1. Atualizar imports
Substituir em todos os arquivos copiados:
```
@/products/campeonato/...  →  @/features/campeonato/...
```

#### 6.2. Remover dependências de produtos não-extraídos
Buscar e remover imports de:
- CRM (`@/modules/crm/*`)
- Loyalty (`@/contexts/CustomerContext`, `@/modules/loyalty/*`)
- Achadinhos (`@/components/customer/Achadinho*`)
- Voucher/cliente (`@/pages/Vouchers*`, `@/pages/Customers*`)
- Qualquer hook de "customer" ou "client"

#### 6.3. Atualizar `queryKeys.ts`
Criar versão enxuta com apenas as chaves usadas pelo campeonato (ver `src/lib/queryKeys.ts` no projeto atual e copiar SÓ a seção `campeonato.*` + dependências core como `brands`, `branches`, `customers`).

#### 6.4. Atualizar Supabase client
- `src/integrations/supabase/client.ts` deve ler `import.meta.env.VITE_SUPABASE_URL` + `VITE_SUPABASE_PUBLISHABLE_KEY` (que você configurou nas env vars do Lovable apontando pro SEU Supabase)
- Gerar types do seu schema:
  ```bash
  supabase gen types typescript --project-id abc123 > src/integrations/supabase/types.ts
  ```
  Rodar esse comando sempre que mudar schema

#### 6.5. Bug fixes já aplicados (manter no novo)
- PR #14: pre-check exclui finished + mensagem informativa
- PR #15: retry import + sem reload pós-mount + audit/error deferred
- PR #16: histórico filtra por branch + botão cancelar em zumbis
- PR #12: retry em RPCs do campeonato

---

### Passo 7 — Configurar admin do novo SaaS

Criar telas mínimas:

#### 7.1. `BrandsAdmin.tsx` (só `root_admin`)
- CRUD de marcas (nome, slug, trial_expires_at, is_active)
- Botão "Adicionar admin" pra cada brand (cria `user_roles` brand_admin)

#### 7.2. `BranchesAdmin.tsx` (root + brand_admin)
- CRUD de cidades por marca
- Cada cidade tem: nome, slug, city, state

#### 7.3. `DriversAdmin.tsx` (brand_admin + branch_admin)
- CRUD de motoristas por cidade
- Importação CSV (CPF, nome, telefone)
- Validar duplicidade por CPF dentro da brand

#### 7.4. `ApiIntegrationsPage.tsx` (brand_admin)
- Gerar API key por cidade
- Mostrar `webhook_url`: `https://[supabase-url]/functions/v1/machine-webhook`
- Documentação inline do payload esperado

---

### Passo 8 — Verificação end-to-end

#### 8.1. Verificar deploy

```bash
# Build local
npm run build  # deve passar sem erros

# Type check
npx tsc --noEmit  # zero erros

# Lovable detecta push → faz deploy automático
git push origin main
```

#### 8.2. Smoke test do fluxo completo

1. **Setup admin:**
   - Login como root_admin
   - Criar Brand "Teste Brand"
   - Criar Branch "São Paulo / SP"
   - Criar admin brand
   - Logout

2. **Setup brand admin:**
   - Login como brand_admin
   - Criar 5 motoristas com CPF
   - Gerar API key da cidade
   - Logout

3. **Criar temporada:**
   - Login brand_admin
   - Ir em Campeonato
   - "Criar temporada" → Setembro 2026 → 3 séries A/B/C
   - Distribuir motoristas

4. **Simular corridas (cURL):**
   ```bash
   curl -X POST https://[supabase-url]/functions/v1/machine-webhook \
     -H "x-api-key: [a chave gerada]" \
     -H "Content-Type: application/json" \
     -d '{
       "machine_ride_id": "test-001",
       "driver_id": "[cpf-motorista]",
       "ride_status": "FINALIZED",
       "ride_value": 25.50,
       "finalized_at": "2026-09-01T07:00:00Z"
     }'
   ```

5. **Login motorista:**
   - Abrir `/driver?brandId=[id]` no celular
   - Digitar CPF cadastrado
   - Upload foto obrigatória
   - Inscrever na temporada
   - Verificar que a corrida apareceu no placar

6. **Realtime:**
   - Manter aba motorista aberta
   - Disparar nova corrida via cURL
   - Confirmar que placar atualiza SEM refresh manual

#### 8.3. Testes automatizados (opcional, mas recomendado)

Migrar os testes do projeto atual:
- `src/products/campeonato/__tests__/*` → `src/features/campeonato/__tests__/*`
- Adaptar mocks pra novo Supabase

#### 8.4. Validar isolamento multi-tenant

- Criar 2 brands diferentes
- Logar como admin da Brand A
- Confirmar que NÃO consegue ver/editar Brand B nem suas branches/motoristas/temporadas
- Tentar chamar webhook com API key da Brand A pra registrar corrida da Brand B → deve falhar

---

## Critérios de sucesso

Você terá completado quando:

- ✅ Supabase próprio (em supabase.com) provisionado em região Brasil
- ✅ Lovable conectado ao seu Supabase via env vars `VITE_SUPABASE_URL` + `VITE_SUPABASE_PUBLISHABLE_KEY`
- ✅ Supabase CLI instalado e linked ao projeto pra gerenciar migrations/functions
- ✅ Repositório novo `ubizcarbrasil/campeonato-motoristas` criado e deployado via Lovable
- ✅ Banco Supabase com todas as tabelas + RLS + RPCs + triggers (aplicadas via CLI ou dashboard)
- ✅ Edge function `machine-webhook` deployada via `supabase functions deploy` e recebendo corridas
- ✅ Cron `pg_cron` configurado pra advance phases a cada 5min
- ✅ Painel admin com Brands → Branches → Motoristas → API Keys → Campeonato
- ✅ Painel motorista (login CPF + foto + temporada + duelos + classificação + chaveamento + artilharia)
- ✅ Realtime funcionando: corrida via cURL → placar atualiza ao vivo no celular
- ✅ Isolamento brand × branch validado (root vê tudo, brand_admin só sua brand, branch_admin só sua cidade)
- ✅ Bug fixes do projeto atual aplicados (PR #12, #14, #15, #16)

## Riscos e mitigação

| Risco | Mitigação |
|---|---|
| Código copiado quebra por imports faltantes (CRM, customer, etc.) | Buscar exhaustivo com `grep -rE "import.*@/(modules/crm|contexts/CustomerContext|...)"` e remover/adaptar |
| Triggers de pontuação não disparam por nome de tabela diferente | Usar nomes finais `campeonato_*` direto na migration, não usar `duelo_*` legado |
| Auth admin vs motorista coexistir confunde rotas | `/driver` é rota pública (CPF login); `/admin/*` requer Supabase Auth |
| Webhook recebe corrida de motorista que não existe naquela cidade | Validação no webhook: rejeitar se `driver_customer_id` não pertence a `brand_id` + `branch_id` da API key |
| Cliente atual quer também migrar dados → não vamos sincronizar bancos | Onboarding independente foi a decisão. Migração manual via SQL/import se necessário |
| Esquecer de aplicar uma migration no Supabase remoto | Usar `supabase db push` desde dia 1; nunca editar SQL via Dashboard sem versionar |
| Edge function quebra após mudança e Lovable não redeploy | Edge functions são deployadas via `supabase functions deploy` MANUAL — colocar em script `npm run deploy:functions` pra não esquecer |
| Lovable mexer no `supabase/` se detectar mudanças | Adicionar `supabase/` em `.lovable-ignore` (se existir) ou comentar claramente que é gerenciado manualmente |
| Service role key vazar pro frontend | NUNCA usar `service_role` no React. Apenas em edge functions via `supabase secrets set` |

## Próximos passos depois de lançar

- (Futuro) Notificações via push/WhatsApp/Telegram (tabela `campeonato_notifications` + edge function)
- (Futuro) Recurso real-time avançado: presenças, posições ao vivo
- (Futuro) Visual Brasileirão completo (tema `tema-campeonato` já existe, polir)
- (Futuro) Bracket interativo (`AbaChaveamento` + `BracketCompleto`)
- (Futuro) Estado educativo quando sem temporada ativa

---

## Arquivos críticos a consultar no projeto atual (referência)

| Tópico | Caminho |
|---|---|
| Módulo campeonato completo | `src/products/campeonato/` |
| Página motorista | `src/products/campeonato/pages/pagina_campeonato_motorista.tsx` |
| Página empreendedor | `src/products/campeonato/pagina_campeonato_empreendedor.tsx` |
| Webhook de corridas | `supabase/functions/machine-webhook/index.ts` |
| Login motorista | `src/components/driver/DriverCpfLogin.tsx` |
| Session motorista | `src/contexts/DriverSessionContext.tsx` |
| Tema visual Brasileirão | `src/index.css` (procurar `.tema-campeonato`) |
| Auth admin | `src/contexts/AuthContext.tsx` |
| Brand resolve | `src/contexts/BrandContext.tsx` |
| Vite config (bundle split) | `vite.config.ts` |
| Migration de rename `duelo_*` → `campeonato_*` | `supabase/migrations/20260513201201_*.sql` |
| Migration de UNIQUE index parcial | `supabase/migrations/20260514102435_*.sql` |
| RPC `driver_get_top_riders` | `supabase/migrations/20260514153212_*.sql` |

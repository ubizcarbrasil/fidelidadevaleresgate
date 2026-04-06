

## Etapa 5 — Cinturão da Cidade

### O que será feito
Criar o sistema de "Cinturão da Cidade" — um troféu permanente que destaca o motorista com o maior recorde de corridas (mensal ou histórico, configurável). Inclui nova tabela, RPC de apuração, hook de dados e tela premium.

---

### 1. Banco de dados — Nova tabela + RPC

**Tabela `city_belt_champions`**

```sql
CREATE TABLE public.city_belt_champions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id uuid NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  brand_id uuid NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  champion_customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  record_value bigint NOT NULL DEFAULT 0,
  record_type text NOT NULL DEFAULT 'monthly',
  achieved_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (branch_id, record_type)
);

ALTER TABLE public.city_belt_champions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view belt champions"
  ON public.city_belt_champions FOR SELECT
  TO anon, authenticated
  USING (true);
```

Trigger de validação para `record_type` (apenas `monthly` ou `all_time`).

**RPC `get_city_belt_champion`** (SECURITY DEFINER, STABLE)

Parâmetros: `p_branch_id uuid`

Retorna os dados do cinturão atual: champion info + record. Faz join com `customers` para nome e com `driver_duel_participants` para apelido/avatar.

**RPC `update_city_belt`** (SECURITY DEFINER)

Parâmetros: `p_branch_id uuid, p_brand_id uuid`

Verifica quem tem o maior número de corridas no mês (via `machine_rides`), compara com o campeão atual, e atualiza se houve mudança. Upsert na tabela `city_belt_champions`.

---

### 2. Novos arquivos

**`src/components/driver/duels/hook_cinturao_cidade.ts`**
- Hook `useCinturaoCidade(branchId)` — chama RPC `get_city_belt_champion`, retorna dados do campeão atual (nome, apelido, avatar, recorde, data, tipo)
- Refetch a cada 60s

**`src/components/driver/duels/CinturaoCidadeSheet.tsx`**
- Tela fullscreen premium com visual de troféu/cinturão
- Layout: header com ícone de coroa, card central dourado com avatar do campeão, nome/apelido, recorde, data da conquista, tipo do recorde
- Gradiente dourado, sombras, ícones de coroa e estrelas
- Bloco motivacional: "Supere o recorde e conquiste o cinturão!"
- Se não há campeão ainda: empty state convidativo

**`src/components/driver/duels/CardCampeao.tsx`**
- Card premium do campeão: borda dourada, avatar grande, badge de cinturão, recorde em destaque, data formatada

---

### 3. Integração

**`src/components/driver/duels/DuelsHub.tsx`** (modificado)
- Novo estado `showCinturao` e botão "🏅 Cinturão da Cidade" visível quando `configDuelos?.cinturaoAtivo !== false`
- Renderizar `CinturaoCidadeSheet` quando ativo

---

### Arquivos envolvidos
- Migration SQL (tabela + 2 RPCs + RLS)
- `src/components/driver/duels/hook_cinturao_cidade.ts` (novo)
- `src/components/driver/duels/CinturaoCidadeSheet.tsx` (novo)
- `src/components/driver/duels/CardCampeao.tsx` (novo)
- `src/components/driver/duels/DuelsHub.tsx` (modificado)


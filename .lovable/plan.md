

## Plano: Preços dos Planos Editáveis pelo Admin

### Problema
Os preços dos planos (R$97, R$197, R$397) estão hardcoded no frontend (`SubscriptionPage.tsx`) e na edge function (`create-checkout/index.ts`). Não há como editar sem alterar código.

### Solução
Criar uma tabela `subscription_plans` no banco para armazenar nome, preço, features e configurações visuais de cada plano. O admin ROOT poderá editar via UI. Tanto a página de assinatura quanto o checkout lerão os valores do banco.

### Implementação

#### 1. Migration SQL — Tabela `subscription_plans`
```sql
CREATE TABLE subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_key text UNIQUE NOT NULL,        -- starter, profissional, enterprise
  label text NOT NULL,
  price_cents integer NOT NULL,          -- 9700 = R$97
  features text[] DEFAULT '{}',
  excluded_features text[] DEFAULT '{}',
  is_popular boolean DEFAULT false,
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```
Popular com os 3 planos atuais e seus preços/features.

#### 2. `src/pages/SubscriptionPage.tsx` — Ler preços do banco
- Substituir array `PLANS` hardcoded por uma query à tabela `subscription_plans`
- Formatar `price_cents / 100` para exibição
- Manter visual atual, apenas fonte de dados muda

#### 3. `supabase/functions/create-checkout/index.ts` — Ler preço do banco
- Ao invés de usar `PRICES[plan]`, buscar `price_cents` da tabela `subscription_plans` onde `plan_key = plan`
- Usar o `label` do banco no `product_data.name`

#### 4. Nova página `src/pages/SubscriptionPlansAdminPage.tsx` — UI de edição (ROOT only)
- Tabela editável com: Label, Preço (R$), Features (textarea), Excluídos (textarea), Popular (switch), Ativo (switch)
- Botão salvar por plano (update individual)
- Acessível via rota `/plan-pricing` no menu ROOT

#### 5. Rota + Menu
- Adicionar rota `/plan-pricing` no `App.tsx`
- Adicionar item no `RootSidebar.tsx`

### Arquivos a editar
- **Migration SQL**: criar tabela + seed dos 3 planos
- `src/pages/SubscriptionPage.tsx`: query ao banco ao invés de hardcoded
- `supabase/functions/create-checkout/index.ts`: buscar preço do banco
- `src/pages/SubscriptionPlansAdminPage.tsx`: nova página admin
- `src/App.tsx`: nova rota
- `src/components/consoles/RootSidebar.tsx`: item de menu


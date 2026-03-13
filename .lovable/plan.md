

## Plano: Sistema de Campanhas Patrocinadas

### Objetivo
Permitir que administradores marquem parceiros como "patrocinados" com período de vigência, e que essas lojas ganhem destaque visual (selo "Patrocinado") e prioridade de posicionamento na home do cliente.

### 1. Nova tabela: `sponsored_placements`

```sql
CREATE TABLE public.sponsored_placements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  starts_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz NOT NULL,
  priority int NOT NULL DEFAULT 0,
  placement_type text NOT NULL DEFAULT 'HOME_BOOST',
  notes text,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.sponsored_placements ENABLE ROW LEVEL SECURITY;

-- RLS: authenticated users with brand access can manage
CREATE POLICY "Brand admins manage sponsored" ON public.sponsored_placements
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'root_admin') OR brand_id IN (SELECT public.get_user_brand_ids(auth.uid())));

-- Index for active lookups
CREATE INDEX idx_sponsored_active ON public.sponsored_placements (brand_id, is_active, ends_at);
```

### 2. Página admin: `SponsoredPlacementsPage.tsx`
- Nova rota `/sponsored-placements` no console Brand/Root
- Tabela listando campanhas ativas/expiradas com store name, período, prioridade, status
- Dialog para criar/editar: selecionar loja, datas início/fim, prioridade (1-10), notas
- Toggle ativo/inativo
- Filtro por status (ativas, expiradas, todas)

### 3. Selo visual no customer app
- No `HomeSectionsRenderer.tsx`, ao renderizar cards de ofertas/lojas, consultar os `sponsored_placements` ativos e exibir um badge "Patrocinado" (ícone Zap + texto dourado) no card
- Lojas patrocinadas aparecem primeiro nas seções (boost de ordenação)

### 4. Lógica de boost na home
- No `HomeSectionsRenderer.tsx`, após buscar ofertas/lojas de cada seção, reordenar colocando as patrocinadas no topo (por prioridade DESC), seguidas das demais na ordem normal
- A query de sponsored é feita uma vez no componente pai e passada para os carrosséis

### 5. Integração no sidebar
- Adicionar link "Patrocinados" no `BrandSidebar.tsx` e `RootSidebar.tsx` com ícone `Zap`

### Arquivos a criar/modificar

| Arquivo | Ação |
|---------|------|
| Migration SQL | Criar tabela `sponsored_placements` |
| `src/pages/SponsoredPlacementsPage.tsx` | **Criar** — CRUD admin |
| `src/App.tsx` | Adicionar rota |
| `src/components/consoles/BrandSidebar.tsx` | Link no menu |
| `src/components/HomeSectionsRenderer.tsx` | Query sponsored + badge + boost ordering |
| `src/components/customer/OfferBadge.tsx` | Novo tipo "Patrocinado" |

### Riscos
- Zero impacto em lógica existente — apenas adiciona query e reordena visualmente
- RLS protege dados por brand_id
- Campanhas expiradas são automaticamente ignoradas via filtro `ends_at > now()`


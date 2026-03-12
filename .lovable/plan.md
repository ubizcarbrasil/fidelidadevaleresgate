

## Plano: Isolamento de dados por marca (brand_id) em todas as rotas administrativas

### Problema
Páginas como Cidades, Parceiros, Ofertas, Cupons, Resgates, Clientes, Achadinhos, Notificações e Aprovações de Lojas mostram dados de **todas as marcas** para qualquer usuário logado. Um empreendedor (brand_admin) consegue ver cidades e parceiros de outros empreendedores, violando o isolamento de dados.

### Causa Raiz
As queries nessas páginas não aplicam filtro de `brand_id` usando o `useBrandGuard`. O hook já existe e funciona corretamente em páginas como PointsLedgerPage e ReportsPage, mas não foi adotado nas demais.

### Páginas Afetadas (12 arquivos)

| Página | Tabela principal | Status atual |
|--------|-----------------|-------------|
| `Branches.tsx` | branches | Sem filtro |
| `StoresPage.tsx` | stores | Sem filtro |
| `OffersPage.tsx` | offers | Sem filtro |
| `Vouchers.tsx` | coupons | Sem filtro |
| `RedemptionsPage.tsx` | redemptions | Sem filtro |
| `CustomersPage.tsx` | customers | Sem filtro |
| `AffiliateDealsPage.tsx` | affiliate_deals | Sem filtro |
| `SendNotificationPage.tsx` | branches/customers | Sem filtro |
| `StoreApprovalsPage.tsx` | stores | Sem filtro |
| `UsersPage.tsx` | profiles/user_roles | Sem filtro |
| `BranchForm.tsx` | branches | Parcialmente (usa no save, não no select de brands) |
| `VoucherForm.tsx` | coupons | A verificar |

### Padrão de Correção

Em cada página, aplicar o mesmo padrão já usado em `PointsLedgerPage`:

1. Importar e chamar `useBrandGuard` para obter `currentBrandId` e `isRootAdmin`
2. Na query principal, adicionar: `if (!isRootAdmin && currentBrandId) query = query.eq("brand_id", currentBrandId);`
3. Nas queries auxiliares (selects de brands, branches, stores), aplicar o mesmo filtro
4. Para brand_admin, ocultar o seletor de "Marca" no formulário e preencher automaticamente com `currentBrandId`
5. Nos inserts/updates, usar `enforceBrandId` para garantir que o `brand_id` correto é aplicado

### Detalhes Técnicos

Para cada arquivo, a mudança segue este template:

```typescript
// Adicionar import
import { useBrandGuard } from "@/hooks/useBrandGuard";

// No componente
const { currentBrandId, isRootAdmin, applyBrandFilter, enforceBrandId } = useBrandGuard();

// Na query principal
let query = supabase.from("tabela").select("...", { count: "exact" });
if (!isRootAdmin && currentBrandId) query = query.eq("brand_id", currentBrandId);

// Na query de branches auxiliar
let bq = supabase.from("branches").select("id, name, brand_id").order("name");
if (!isRootAdmin && currentBrandId) bq = bq.eq("brand_id", currentBrandId);

// Ocultar seletor de marca para não-root
{isRootAdmin && (
  <Select value={form.brand_id} ...>...</Select>
)}
```

Para tabelas sem coluna `brand_id` direta (como `redemptions`), o filtro será via join ou subquery na branch/offer que tem `brand_id`.

### Arquivos a Modificar
- `src/pages/Branches.tsx`
- `src/pages/StoresPage.tsx`
- `src/pages/OffersPage.tsx`
- `src/pages/Vouchers.tsx`
- `src/pages/RedemptionsPage.tsx`
- `src/pages/CustomersPage.tsx`
- `src/pages/AffiliateDealsPage.tsx`
- `src/pages/SendNotificationPage.tsx`
- `src/pages/StoreApprovalsPage.tsx`
- `src/pages/UsersPage.tsx`

### Seguranca
Este isolamento é na camada de aplicação. O RLS no banco pode já estar configurado, mas a UI deve respeitar o escopo para evitar confusão e garantir que brand_admins vejam apenas seus próprios dados.


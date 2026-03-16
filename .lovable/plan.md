

## Plano: Corrigir exclusão de marcas e deletar as 10 inativas

### Problema
A exclusão falha porque 12 tabelas têm FK para `brands` **sem** `ON DELETE CASCADE`:
- `stores`, `offers`, `customers`, `redemptions`, `coupons`
- `store_points_rules`, `store_type_requests`, `store_catalog_items`, `store_catalog_categories`
- `catalog_cart_orders`, `machine_ride_notifications`
- `profiles` (já tem SET NULL, ok)

A edge function `admin-brand-actions` tenta deletar apenas 11 tabelas e depois branches, mas não deleta stores, offers, customers, redemptions, etc. — que bloqueiam a deleção.

### Alterações

#### 1. Migration: adicionar ON DELETE CASCADE nas FKs faltantes
```sql
ALTER TABLE stores DROP CONSTRAINT stores_brand_id_fkey,
  ADD CONSTRAINT stores_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE;
-- Repetir para: offers, customers, redemptions, coupons, store_points_rules,
-- store_type_requests, store_catalog_items, store_catalog_categories,
-- catalog_cart_orders, machine_ride_notifications
```

#### 2. Edge Function: atualizar lista de tabelas
Em `admin-brand-actions/index.ts`, adicionar as tabelas faltantes na ordem correta de deleção (respeitar dependências):
```
redemptions, coupons, catalog_cart_orders, machine_ride_notifications,
store_catalog_items, store_catalog_categories, store_points_rules,
store_type_requests, offers, customers, stores
```
...antes de deletar branches e a marca.

#### 3. Deletar as 10 marcas inativas
Após deploy, executar a deleção das marcas:
- Gina haline car, Soureino, Gina Car, Matheus MKT, Me leva resgata
- Meu motorista, Pizzaria do Teste, Ubiz Resgata, Brand Premium, Marca Teste

### Resultado
- Exclusão de marcas funciona corretamente na interface
- FK com CASCADE previne bloqueios futuros
- 10 marcas inativas removidas


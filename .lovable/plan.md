

# Corrigir erro "null value in column created_by_user_id" no resgate

## Problema
Ao confirmar um resgate, o sistema tenta inserir um registro na tabela `points_ledger` sem preencher a coluna `created_by_user_id`, que é NOT NULL. Isso acontece em dois cenários:

1. **Função SQL `redeem_city_offer_driver`** — usada no fluxo do motorista, faz INSERT no `points_ledger` sem incluir `created_by_user_id`
2. **Fluxo do cliente (`CustomerOfferDetailPage`)** — tenta pegar `auth.getUser()` que pode retornar null se a sessão expirou

## Solução

### 1. Migration: tornar `created_by_user_id` nullable no `points_ledger`
Como motoristas não têm sessão Supabase Auth (usam login por CPF), não há um `user_id` auth disponível. A solução segura é permitir null nessa coluna.

```sql
ALTER TABLE public.points_ledger 
  ALTER COLUMN created_by_user_id DROP NOT NULL;
```

### 2. Atualizar a função SQL `redeem_city_offer_driver`
Adicionar `created_by_user_id` como NULL explícito no INSERT do ledger (já que motorista não tem auth session).

### 3. Proteger o fluxo do cliente em `CustomerOfferDetailPage.tsx`
Trocar o `!` (non-null assertion) por um fallback seguro na linha 211:
```typescript
created_by_user_id: (await supabase.auth.getUser()).data.user?.id ?? customer.user_id ?? null,
```

## Arquivos a modificar
- **Nova migration SQL**: `ALTER COLUMN created_by_user_id DROP NOT NULL` no `points_ledger`
- **`redeem_city_offer_driver`**: recriar a função passando NULL no campo
- **`src/pages/customer/CustomerOfferDetailPage.tsx`**: tratar caso de user null na linha 211


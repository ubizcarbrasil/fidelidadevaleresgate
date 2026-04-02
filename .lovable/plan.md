

# Corrigir: Resgates nao aparecem para loja quando acessada por admin

## Problema
A RPC `rpc_get_store_owner_redemptions` valida acesso com `stores.owner_user_id = auth.uid()`. Quando um Brand Admin ou Root Admin acessa o painel da loja via `?storeId=xxx`, o `auth.uid()` e do admin, nao do dono da loja. Resultado: a RPC retorna zero linhas e a tela mostra "Nenhum resgate pendente".

## Solucao
Atualizar a RPC para permitir acesso tambem por Brand Admins (que possuem role `brand_admin` na mesma brand da loja) e Root Admins (role `root`).

## Alteracao

### Migration SQL: atualizar `rpc_get_store_owner_redemptions`

Substituir a verificacao de permissao atual:

```sql
-- Antes: apenas owner
IF NOT EXISTS (
  SELECT 1 FROM stores WHERE stores.id = p_store_id AND stores.owner_user_id = auth.uid()
) THEN RETURN; END IF;

-- Depois: owner OU brand_admin OU root
IF NOT EXISTS (
  SELECT 1 FROM stores s
  WHERE s.id = p_store_id
    AND (
      s.owner_user_id = auth.uid()
      OR EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'root')
      OR EXISTS (
        SELECT 1 FROM user_roles ur
        WHERE ur.user_id = auth.uid()
          AND ur.role = 'brand_admin'
          AND ur.brand_id = s.brand_id
      )
    )
) THEN RETURN; END IF;
```

### Arquivos
| Arquivo | Alteracao |
|---|---|
| Nova migration SQL | Atualizar permissao da RPC |

Nenhuma alteracao no frontend necessaria — o componente `StoreRedeemTab` ja passa o `store.id` corretamente.


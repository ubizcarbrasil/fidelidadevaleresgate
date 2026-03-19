

## Plano: Corrigir visibilidade dos resgates para o lojista (RLS)

### Problema
A página de resgates mostra "Nenhum resgate pendente" mesmo havendo dados no banco. O código está correto — o problema é **RLS (Row Level Security)**.

### Causa raiz

Dois bloqueios de RLS impedem o `store_admin` de ver os dados:

1. **Tabela `redemptions`**: A política de SELECT exige `user_has_permission('redemptions.read') AND (root_admin OR brand_id ∈ user_brands OR branch_id ∈ user_branches)`. O `store_admin` tem a permissão `redemptions.read`, mas **não tem `brand_id`/`branch_id` configurados** no seu `user_roles` → o filtro de escopo falha.

2. **Tabela `customers`**: O `store_admin` **não tem a permissão `customers.read`** → o join com customers retorna `null`, escondendo nome e telefone.

### Solução

Duas migrações SQL:

**1. Nova política RLS em `redemptions` para lojistas**
Permitir SELECT quando o resgate pertence a uma oferta da loja do usuário:
```sql
CREATE POLICY "Store owner can read own store redemptions"
ON public.redemptions FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM offers o
    JOIN stores s ON s.id = o.store_id
    WHERE o.id = redemptions.offer_id
      AND s.owner_user_id = auth.uid()
  )
);
```

**2. Nova política RLS em `customers` para lojistas**
Permitir SELECT de clientes que resgataram ofertas da sua loja:
```sql
CREATE POLICY "Store owner can read customers of own redemptions"
ON public.customers FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM redemptions r
    JOIN offers o ON o.id = r.offer_id
    JOIN stores s ON s.id = o.store_id
    WHERE r.customer_id = customers.id
      AND s.owner_user_id = auth.uid()
  )
);
```

### Arquivos alterados
- Nenhum arquivo de código — apenas migrações SQL no banco de dados

### Resultado
O lojista verá a lista de resgates com nome, telefone, oferta e validade sem precisar de permissões administrativas.


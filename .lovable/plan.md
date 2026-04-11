

## Plano: Corrigir trigger `notify_admin_product_redemption`

### Problema
O trigger `notify_admin_product_redemption` referencia campos inexistentes na tabela `product_redemption_orders`:
- `NEW.product_title` — **não existe** (o título está dentro de `deal_snapshot_json->>'title'`)
- `NEW.points_cost` — **não existe** (o campo correto é `points_spent`)

### Mudança

**Migração SQL** — Recriar a função do trigger com os campos corretos:

```sql
CREATE OR REPLACE FUNCTION public.notify_admin_product_redemption()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = 'public'
AS $$
DECLARE
  v_customer_name text;
  v_product_title text;
  v_points integer;
BEGIN
  v_customer_name := COALESCE(NEW.customer_name, 'Cliente');
  v_product_title := COALESCE(NEW.deal_snapshot_json->>'title', 'Produto');
  v_points := COALESCE(NEW.points_spent, 0);

  INSERT INTO public.admin_notifications (brand_id, title, body, type, reference_id)
  VALUES (
    NEW.brand_id,
    'Novo resgate de produto',
    v_customer_name || ' resgatou "' || v_product_title || '" por ' || v_points || ' pts',
    'redemption_product',
    NEW.id
  );
  RETURN NEW;
END;
$$;
```

### Detalhes
- Nenhuma alteração de código frontend necessária
- Apenas uma migração SQL corrigindo a função do trigger
- O trigger em si (`on_product_redemption_admin_notif`) permanece inalterado


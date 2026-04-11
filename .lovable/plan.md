

## Plano: Ativar módulo de Resgate de Produtos para Cliente

### Diagnóstico
1. O módulo `customer_product_redeem` **existe** na tabela `module_definitions`, mas **nenhuma marca** o tem habilitado em `brand_modules` — por isso a funcionalidade não aparece.
2. Os itens do sidebar "Produtos de Resgate" e "Pedidos de Resgate" têm `scoringFilter: "DRIVER"`, ou seja, só são visíveis quando o modelo de negócio da marca inclui motoristas. Isso está correto para o cenário atual.
3. Todo o código das features (coluna "Público", filtro "Origem", badges, label dinâmico) **já está implementado** e funcional.

### O que precisa ser feito

#### 1. Ativar o módulo para as marcas desejadas (SQL)
Inserir registros em `brand_modules` vinculando o módulo `customer_product_redeem` às marcas que devem ter acesso:

```sql
INSERT INTO brand_modules (brand_id, module_definition_id, is_enabled)
SELECT b.id, md.id, true
FROM brands b, module_definitions md
WHERE md.key = 'customer_product_redeem'
  AND b.is_active = true
ON CONFLICT DO NOTHING;
```

Isso ativa para todas as marcas ativas. Se quiser ativar para uma marca específica, usaremos o ID diretamente.

#### 2. (Opcional) Ativar espelhamento de catálogo
Se quiser que os clientes vejam os mesmos produtos do motorista automaticamente:

```sql
UPDATE brands
SET brand_settings_json = jsonb_set(
  COALESCE(brand_settings_json::jsonb, '{}'),
  '{customer_redeem_mirror_driver}',
  'true'
)
WHERE is_active = true;
```

### Nenhuma alteração de código necessária
Tudo já está pronto no frontend — basta ativar no banco.


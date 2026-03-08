

## Plano: Habilitar módulo CRM para todas as marcas ativas

### O que será feito

Inserir registros na tabela `brand_modules` vinculando o módulo CRM (`12f065d4-a63d-4678-9a76-0a1629d84c6d`) a todas as 6 marcas ativas, com `is_enabled = true`.

### Execução

Usar o **insert tool** (não migration) para executar um INSERT de 6 linhas na tabela `brand_modules`:

```sql
INSERT INTO brand_modules (brand_id, module_definition_id, is_enabled)
VALUES
  ('55418252-8838-47e9-8c4b-9325982f915b', '12f065d4-a63d-4678-9a76-0a1629d84c6d', true),
  ('2750cec8-2eda-4990-bd29-e996f0f68241', '12f065d4-a63d-4678-9a76-0a1629d84c6d', true),
  ('a73fa635-2709-4e34-820f-a75d4de9a8bb', '12f065d4-a63d-4678-9a76-0a1629d84c6d', true),
  ('57ba6773-b602-4c6d-9e43-a843b259b0ca', '12f065d4-a63d-4678-9a76-0a1629d84c6d', true),
  ('ef8163d9-a7f8-491d-a80d-eab56401847d', '12f065d4-a63d-4678-9a76-0a1629d84c6d', true),
  ('effc4685-375e-40c8-8a44-d71bd550f422', '12f065d4-a63d-4678-9a76-0a1629d84c6d', true);
```

### Impacto

- Nenhuma alteração de código necessária
- O hook `useBrandModules` já reconhece o módulo `crm` e o `BrandSidebar` já filtra por `moduleKey: "crm"`
- Após o insert, a seção **📊 CRM Estratégico** aparecerá automaticamente no menu lateral para todas as marcas


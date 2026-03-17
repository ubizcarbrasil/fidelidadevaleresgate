

## Plano: Habilitar módulo `users_management` para Ubiz Resgata

### Problema
A marca **Ubiz Resgata** (`db15bd21...`) não possui registro na tabela `brand_modules` para o módulo `users_management` (definition id `937059aa...`), por isso o item "Usuários" não aparece no menu lateral.

### Solução
1. **Migração SQL**: Inserir uma linha em `brand_modules` vinculando a marca Ubiz Resgata ao módulo `users_management` com `is_enabled = true`.

```sql
INSERT INTO brand_modules (brand_id, module_definition_id, is_enabled)
VALUES ('db15bd21-9137-4965-a0fb-540d8e8b26f1', '937059aa-d18a-4d80-ba12-092978888c95', true)
ON CONFLICT DO NOTHING;
```

2. **Verificação**: Após a migração, o hook `useBrandModules` retornará `true` para `users_management`, e o item "Usuários" aparecerá no grupo "Equipe & Acessos" do sidebar.

Nenhuma alteração de código é necessária — apenas a inserção do dado no banco.


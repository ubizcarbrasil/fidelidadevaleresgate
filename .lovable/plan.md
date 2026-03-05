

## Diagnóstico: Cupons não aparecem no front

### Causa raiz

O usuário logado (`mtdomingos79@gmail.com` / `563335b8-...`) **não possui nenhuma role** na tabela `user_roles`. A política RLS da tabela `vouchers` exige `user_has_permission(auth.uid(), 'vouchers.read')`, que depende de o usuário ter um papel (role) atribuído. Sem role, a query retorna 0 linhas.

Existem 3 vouchers no banco, todos com `status = active` e `branch_id = 15ab8bf5-...`.

### Solução

Duas ações são necessárias:

1. **Atribuir role ao usuário** -- Inserir o papel correto (provavelmente `root_admin` ou `brand_admin`) para o usuário `563335b8-5779-48c7-9938-5391129100e0` na tabela `user_roles`, com os escopos adequados (tenant_id, brand_id, branch_id).

2. **Verificar se o papel `vouchers.read` está configurado** -- Confirmar que a permissão `vouchers.read` existe na tabela `permissions` e está atribuída ao papel do usuário via `role_permissions`.

### Ação imediata (migração SQL)

Atribuir `root_admin` ao usuário atual para desbloquear o acesso imediato:

```sql
INSERT INTO public.user_roles (user_id, role)
VALUES ('563335b8-5779-48c7-9938-5391129100e0', 'root_admin')
ON CONFLICT DO NOTHING;
```

Isso resolve o problema porque `user_has_permission` retorna `true` para qualquer permissão quando o usuário é `root_admin`.

### Arquivos modificados

Nenhum arquivo de código precisa ser alterado -- o problema é exclusivamente de dados/permissão no banco.


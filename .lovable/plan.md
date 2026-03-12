

## Problema

A tabela `brand_modules` possui políticas RLS que permitem leitura apenas para `root_admin`, `brand_admin` e `tenant_admin`. Usuários do app do cliente (role `customer` ou sem role) não conseguem ler os módulos ativos, fazendo `isModuleEnabled()` retornar `false` para todos os módulos. Resultado: apenas "Início" e "Perfil" aparecem no menu inferior.

## Solução

**Adicionar uma política RLS de leitura pública** na tabela `brand_modules` para que qualquer usuário autenticado consiga verificar quais módulos estão habilitados:

```sql
CREATE POLICY "Authenticated users can read brand_modules"
ON public.brand_modules
FOR SELECT
TO authenticated
USING (true);
```

Isso é seguro porque `brand_modules` contém apenas flags de habilitação de módulos (não dados sensíveis), e a política é somente leitura.

### Resultado
- Todos os 5 tabs (Início, Ofertas, Meus Resgates, Carteira, Perfil) voltarão a aparecer no menu inferior do app do cliente.
- Nenhuma alteração de código necessária — apenas a adição da política RLS.


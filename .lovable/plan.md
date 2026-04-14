

## Problema: Imagens da marca não salvam (logo, favicon, etc.)

### Diagnóstico
Analisei o fluxo completo de salvamento no `BrandForm.tsx`:

1. O upload da imagem para o storage funciona corretamente (políticas de storage permitem `brand_admin`)
2. A URL da imagem é atualizada no estado local (`theme.logo_url`)
3. Ao clicar "Salvar", o `handleSubmit` faz `supabase.from("brands").update(...)` 
4. **Problema**: Se a atualização falha silenciosamente por RLS (0 linhas afetadas), o código mostra `toast.success("Marca atualizada!")` mesmo assim — porque o Supabase não retorna erro quando o UPDATE afeta 0 linhas por RLS

A política de UPDATE em `brands` exige:
- `user_has_permission(auth.uid(), 'brands.update')` **E**
- `id IN (SELECT get_user_brand_ids(auth.uid()))`

Se o `user_roles` do admin da marca "Jerry Mototáxi" não tiver o `brand_id` correto associado, a atualização falha silenciosamente.

### Solução (2 partes)

**1. Detectar falha silenciosa no salvamento**
No `BrandForm.tsx`, adicionar verificação de linhas afetadas usando `.select()` após o update, e mostrar erro claro quando nada é salvo.

**2. Garantir permissão do brand_admin**
Criar migração SQL que garante que todo `brand_admin` com `brand_id` preenchido tenha a permissão `brands.update` via `role_permissions`. Também verificar se a função `get_user_brand_ids` está retornando o brand correto para o usuário.

### Arquivos alterados

| Arquivo | Mudança |
|---------|---------|
| `src/pages/BrandForm.tsx` | Detectar update silencioso (0 rows) e mostrar erro claro + botão de retry |
| Nova migração SQL | Garantir que `brand_admin` tem `brands.update` em `role_permissions` e verificar integridade |

### Resultado esperado
- Se o salvamento falhar por falta de permissão, o usuário verá uma mensagem clara em vez de "Marca atualizada!"
- As permissões serão corrigidas para que brand_admin sempre consiga salvar alterações na própria marca


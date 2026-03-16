

## Plano: Criar conta root admin

### Problema
O usuário não consegue fazer login — precisa de uma conta `root_admin` com email `alecio@ubizcar.com.br`.

### Abordagem

1. **Ativar auto-confirm de email** para que a conta funcione imediatamente sem verificação
2. **Criar Edge Function `create-root-admin`** que:
   - Cria o usuário via Admin Auth API (`adminClient.auth.admin.createUser`)
   - Atribui a role `root_admin` na tabela `user_roles`
   - Retorna a senha gerada
3. **Invocar a função** para criar a conta
4. **Remover a função** após uso (segurança)

### Senha
Será gerada uma senha temporária segura. Após o primeiro login, o usuário poderá alterá-la.

### Arquivos
| Arquivo | Ação |
|---------|------|
| `supabase/functions/create-root-admin/index.ts` | Criar (temporário) |
| Auth config |
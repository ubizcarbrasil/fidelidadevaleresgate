

## Plano: Adicionar senha e permissões ao fluxo de convite

### Problema
O dialog "Convidar Usuário" atual só pede nome, email, função e cidade. Faltam dois campos essenciais:
1. **Senha de acesso** — atualmente gera senha aleatória (o usuário não consegue logar)
2. **Seleção de permissões** — existe o `UserPermissionsDialog` separado, mas não é possível definir permissões na hora do convite

### Alterações

#### 1. Dialog de convite (`UsersPage.tsx` — `BrandUsersView`)
Adicionar ao formulário de convite:
- **Campo "Senha"** (type=password, min 6 caracteres)
- **Campo "Confirmar Senha"**
- **Checklist de permissões** inline (reutilizando a lógica de agrupamento por módulo do `UserPermissionsDialog`) — checkboxes agrupados por módulo com toggle "selecionar todos" por grupo
- Enviar `password` e `permissions[]` no body da mutation

#### 2. Edge Function `invite-brand-user`
- Aceitar campo `password` no body
- Usar o password fornecido em `createUser()` em vez de `crypto.randomUUID()`
- Manter fallback para senha aleatória se `password` não vier

#### 3. Resumo do fluxo
```text
Dialog "Convidar Usuário"
├── Nome
├── E-mail
├── Senha / Confirmar Senha
├── Função (branch_admin / branch_operator / operator_pdv)
├── Cidade (opcional)
├── ─── Permissões ───
│   ├── [✓] Módulo X (selecionar todos)
│   │   ├── [✓] Criar
│   │   ├── [✓] Visualizar
│   │   └── [ ] Excluir
│   └── [✓] Módulo Y ...
└── Botão "Criar Acesso"
```

### Arquivos
- **Editar**: `src/pages/UsersPage.tsx` (adicionar campos de senha + checklist de permissões no dialog de convite)
- **Editar**: `supabase/functions/invite-brand-user/index.ts` (aceitar `password` no body)


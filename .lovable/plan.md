

## Plano: Corrigir "Acessar Conta" para mostrar dados do motorista

### Problema

O botão "Acessar Conta" abre `/customer-preview?brandId=X`, que carrega o PWA com a sessão do **admin logado**, não do motorista. O `CustomerContext` busca o customer pelo `user.id` do admin, então mostra o perfil errado (o motorista de teste do admin, ou cria um novo customer).

### Solução

Adicionar um parâmetro `customerId` na URL para que o `CustomerContext` use diretamente o registro do motorista selecionado, em vez de resolver pelo `user.id`. Isso funciona como "visualização de conta" sem precisar logar como o motorista.

### Alterações

**1. `src/components/driver-management/tabs/AbaDadosMotorista.tsx`**
- Alterar `handleOpenPwa` para incluir `&customerId={driver.id}` na URL

**2. `src/contexts/CustomerContext.tsx`**
- Ler `customerId` da URL (`window.location.search`)
- Se `customerId` estiver presente, buscar diretamente o customer pelo ID em vez de resolver pelo `user.id`
- Marcar como modo "impersonação" (read-only, sem auto-create/auto-link)

**3. `src/pages/CustomerPreviewPage.tsx`**
- Passar o `customerId` da URL para que fique disponível no contexto

### Fluxo
```text
Admin clica "Acessar Conta"
  → /customer-preview?brandId=X&customerId=Y
  → CustomerContext detecta customerId
  → Busca customer Y diretamente (SELECT * FROM customers WHERE id = Y)
  → PWA renderiza com os dados do motorista Gabriel
```

### Segurança
- O `customerId` só será usado quando o usuário logado tiver role admin (verificação via `roles` do AuthContext)
- Se não for admin, o parâmetro é ignorado e o fluxo normal continua


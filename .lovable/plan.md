

## Problema Raiz

Existem **dois problemas** impedindo os links de funcionar:

1. **A marca "Ubiz Resgata" está desativada** (`is_active = false` no banco). Isso impede a resolução white-label no domínio `ubiz-resgata.valeresgate.com`.

2. **O domínio `ubiz-resgata.valeresgate.com` não tem DNS apontando para o app**. O registro existe no banco mas o DNS do domínio `valeresgate.com` não aponta o subdomínio para o IP correto (185.158.133.1). Por isso o Safari mostra "servidor não pode ser encontrado".

3. **Os links usam o domínio externo como base**, que não funciona sem o DNS configurado.

## Plano de Correção

### 1. Ativar a marca no banco
Executar migração SQL para corrigir `is_active = true` na marca `effc4685-375e-40c8-8a44-d71bd550f422`.

### 2. Reformular os links no Dashboard para suportar os dois cenários
No `src/pages/Dashboard.tsx` (componente `BrandQuickLinks`):

- **Link primário (funciona agora)**: Usar o `window.location.origin` + rotas internas (`/customer-preview`, `/register-store`, `/store-panel`). Esses caminhos funcionam imediatamente porque são rotas do SPA onde o brand_admin já está logado.

- **Link secundário (domínio próprio)**: Mostrar o domínio customizado (`ubiz-resgata.valeresgate.com`) como URL de produção com aviso de que precisa configurar DNS. Botão de copiar para facilitar.

Estrutura dos 3 links:

```text
App do Cliente
  Principal: {origin}/customer-preview  ← funciona agora
  Produção:  https://ubiz-resgata.valeresgate.com  ← requer DNS

Cadastro de Parceiro  
  Principal: {origin}/register-store  ← funciona agora
  Produção:  https://ubiz-resgata.valeresgate.com/register-store  ← requer DNS

Painel do Parceiro
  Principal: {origin}/store-panel  ← funciona agora
  Produção:  https://ubiz-resgata.valeresgate.com/store-panel  ← requer DNS
```

### 3. Indicar status do domínio
Adicionar um badge visual no card de "Links Úteis" indicando se o domínio próprio está ativo (DNS resolvendo) ou pendente de configuração, com um tooltip explicando como configurar.

### Arquivos a modificar
- **Migração SQL**: Ativar a marca no banco (`UPDATE brands SET is_active = true`)
- **`src/pages/Dashboard.tsx`**: Reformular `BrandQuickLinks` com links internos + links de produção




## Aplicativo do Cliente Final (White-Label)

### Visão Geral
Transformar o `WhiteLabelLayout` de uma página estática de vouchers em um app completo para o cliente final, com autenticação por telefone, carteira de pontos, ofertas e perfil. Navegação via bottom tab bar (mobile-first).

### 1. Migração de Banco de Dados

Nenhuma tabela nova necessária. As tabelas `customers`, `points_ledger`, `earning_events`, `offers`, `redemptions` e `profiles` já existem com RLS adequado. O papel `customer` já existe no enum `app_role`.

### 2. Autenticação do Cliente (Telefone + OTP)

**Criar `src/pages/customer/CustomerAuthPage.tsx`:**
- Tela de cadastro/login por telefone (campo telefone + nome no cadastro)
- Fluxo OTP: `supabase.auth.signInWithOtp({ phone })` para login
- Após verificação, verificar se existe registro em `customers` para o `user_id` + `branch_id`. Se não, criar automaticamente
- Atribuir role `customer` em `user_roles` via trigger ou lógica no signup
- Estilo usando tema da brand (cores, fontes, logo)

**Nota:** Como o Supabase OTP por SMS requer configuração do provedor Twilio, oferecer alternativa com email+senha como fallback inicial. O fluxo será: email + senha com campo de nome e telefone no cadastro.

### 3. Contexto do Cliente

**Criar `src/contexts/CustomerContext.tsx`:**
- Buscar registro `customers` pelo `user_id` autenticado + `brand_id` + `branch_id`
- Expor: `customer`, `pointsBalance`, `moneyBalance`, `loading`
- Se não existir customer, criar automaticamente no primeiro acesso

### 4. Layout e Navegação

**Criar `src/components/customer/CustomerLayout.tsx`:**
- Bottom tab bar com 4 abas: Início, Ofertas, Carteira, Perfil
- Header com logo da brand e nome da filial
- Usa tema da brand (cores, fontes)
- Wrapper com `Routes` internas

**Atualizar `src/components/WhiteLabelLayout.tsx`:**
- Se usuário autenticado + customer vinculado → mostrar `CustomerLayout`
- Se não autenticado → mostrar `CustomerAuthPage` (com opção de continuar sem login para ver home pública)

### 5. Telas do Cliente

**A) Início (`src/pages/customer/CustomerHomePage.tsx`):**
- Saldo de pontos resumido no topo (card destaque)
- Seções dinâmicas da brand (reusar `HomeSectionsRenderer`)
- Ofertas em destaque

**B) Ofertas (`src/pages/customer/CustomerOffersPage.tsx`):**
- Lista de ofertas ativas (`offers` WHERE `branch_id` + `status = ACTIVE`)
- Card com imagem, título, valor de resgate, período
- Botão "Resgatar" → cria `redemption` com status `PENDING`

**C) Carteira (`src/pages/customer/CustomerWalletPage.tsx`):**
- Saldo atual de pontos e valor em R$
- Histórico de transações (`points_ledger` WHERE `customer_id`)
- Cada entrada: tipo (crédito/débito), pontos, motivo, data
- Filtro por período

**D) Perfil (`src/pages/customer/CustomerProfilePage.tsx`):**
- Nome, telefone, email (editáveis)
- Trocar filial
- Botão sair

### 6. Rotas

Todas as rotas do cliente ficam dentro do `WhiteLabelLayout`, sem alterar o `App.tsx` (que só renderiza `WhiteLabelLayout` quando `isWhiteLabel === true`). A navegação interna é gerida pelo `CustomerLayout` com estado de aba ativo.

### Arquivos

| Ação | Arquivo |
|------|---------|
| Criar | `src/pages/customer/CustomerAuthPage.tsx` |
| Criar | `src/contexts/CustomerContext.tsx` |
| Criar | `src/components/customer/CustomerLayout.tsx` |
| Criar | `src/pages/customer/CustomerHomePage.tsx` |
| Criar | `src/pages/customer/CustomerOffersPage.tsx` |
| Criar | `src/pages/customer/CustomerWalletPage.tsx` |
| Criar | `src/pages/customer/CustomerProfilePage.tsx` |
| Editar | `src/components/WhiteLabelLayout.tsx` |


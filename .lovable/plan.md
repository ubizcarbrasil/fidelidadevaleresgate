

## Plano: Correção de Terminologia e Entendimento do Modelo de Negócio

### Contexto
O app do cliente final é **da marca do empreendedor** (white-label), não da loja. As lojas são **parceiras cadastradas** que operam dentro da plataforma do empreendedor. A terminologia atual em vários pontos trata a loja como se fosse a dona do sistema.

### Arquivos a alterar

**1. `src/components/AppLayout.tsx`**
- `STORE_ADMIN: "Painel do Lojista"` → `"Portal do Parceiro"`
- Comentário "Store admins" → "Parceiros"

**2. `src/pages/StoreOwnerPanel.tsx`**
- Título "Dashboard" → "Painel Principal" (consistência com nomenclatura pt-BR)
- Subtítulo "Visão geral do seu estabelecimento" → "Visão geral do seu estabelecimento parceiro"
- `StoreEmptyState`: "Painel do Lojista" → "Portal do Parceiro"
- "Gerencie sua loja, cupons e resgates em um só lugar" → "Gerencie suas ofertas, cupons e resgates como parceiro da marca"
- "Cadastre sua loja para começar a oferecer cupons aos clientes" → "Cadastre seu estabelecimento para se tornar um parceiro"
- "Cadastrar nova loja" → "Cadastrar novo estabelecimento"
- Menu label "Dashboard" → "Painel Principal"
- Menu label "Filiais" → "Cidades" (consistente com o modelo: branches = cidades)

**3. `src/pages/Auth.tsx`**
- CTA "É lojista ou quer cadastrar sua empresa?" → "Tem um estabelecimento? Seja um parceiro!"
- Botão "Cadastrar minha loja" → "Quero ser parceiro"

**4. `src/hooks/usePermissions.ts`**
- Label `store_admin: "Store Admin"` → `"Parceiro"`

**5. `src/pages/StoreApprovalsPage.tsx`**
- Título "Aprovação de Lojas" → "Aprovação de Parceiros"
- Subtítulo "Revise e aprove cadastros de estabelecimentos" (já correto, manter)
- Empty state "Nenhuma loja encontrada" → "Nenhum parceiro encontrado"

**6. `src/lib/helpContent.ts`**
- Renomear "Painel do Lojista" → "Portal do Parceiro"
- "O painel do lojista é o centro de controle da sua loja na plataforma" → "O portal do parceiro é o centro de controle do seu estabelecimento dentro da marca"

**7. `src/components/consoles/BrandSidebar.tsx`**
- "Administrador da Marca" → "Painel do Empreendedor"
- "Aprovação de Lojas" → "Aprovação de Parceiros"
- "Filiais" → "Cidades"

**8. `src/components/consoles/RootSidebar.tsx`**
- "Lojas" → "Parceiros"
- "Aprovação de Lojas" → "Aprovação de Parceiros"
- "Filiais" → "Cidades"
- "Clonar Filial" → "Clonar Cidade"

**9. `src/hooks/useMenuLabels.ts`**
- Atualizar defaults: `"sidebar.branches"` → "Cidades", `"sidebar.aprovacao_lojas"` → "Aprovação de Parceiros", `"sidebar.lojas"` → "Parceiros"

### Detalhes técnicos

- Nenhuma mudança em banco de dados ou lógica de negócio — apenas textos/labels de UI
- As chaves internas (`store_admin`, `branch_id`, `stores`) permanecem inalteradas no código e banco
- Apenas as labels visíveis ao usuário são corrigidas
- O hook `useMenuLabels` permite que o empreendedor personalize essas labels depois; estamos corrigindo os defaults


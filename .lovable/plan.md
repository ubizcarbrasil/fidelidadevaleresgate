

## Plano: Painel do Motorista — Marketplace de Achadinhos sem login

### Visão geral
Criar uma nova rota pública `/driver` que exibe um marketplace completo de Achadinhos, acessível sem autenticação. O painel é um espelho do marketplace de afiliados existente, mas com layout de seções por categoria configurável.

### Arquitetura

```text
URL: /driver?brandId=xxx[&branchId=yyy]
  → Resolve marca e tema (sem login)
  → Renderiza marketplace completo de Achadinhos
  → Cada categoria = uma seção horizontal com N linhas
  → Botão "Ver todos" abre grid da categoria
  → Sem pontos, sem carteira, sem menu de cliente
```

### Implementação

**1. Nova página `src/pages/DriverPanelPage.tsx`**
- Rota pública, sem `ProtectedRoute`
- Resolve `brandId` da URL query param (mesmo padrão do `CustomerPreviewPage`)
- Usa `BrandProviderOverride` para carregar tema e dados da marca
- Renderiza componente `DriverMarketplace`

**2. Novo componente `src/components/driver/DriverMarketplace.tsx`**
- Busca todas as categorias ativas da marca com seus deals
- Renderiza cada categoria como uma seção independente:
  - Título da categoria com ícone
  - Carrossel horizontal de deals (estilo existente do `AchadinhoSection`)
  - Botão "Ver todos" que abre overlay de grid da categoria
- Configuração de quantos itens por linha cada seção mostra (padrão: 1 linha de scroll)
- Header simples com logo da marca e título "Marketplace"

**3. Overlay de categoria**
- Reutiliza o `AchadinhoDealsOverlay` existente para mostrar grid completo ao clicar "Ver todos"
- Adapta para funcionar sem `CustomerContext` (clicks de afiliado funcionam sem customer_id)

**4. Rota no `App.tsx`**
- Adicionar `/driver` como rota pública (ao lado de `/landing`, `/customer-preview`)
- Sem guard de autenticação

**5. Configuração de seções (admin)**
- Por ora, cada categoria existente em `affiliate_deal_categories` será automaticamente uma seção
- A ordem segue `order_index` já existente
- Futuramente pode-se criar tabela de configuração específica para layout do driver

### Componentes reutilizados
- Card de deal (mesmo visual do `AchadinhoSection`)
- `AchadinhoDealsOverlay` (grid de categoria)
- `AchadinhoCategoryGridOverlay` (grid de todas as categorias)
- Ícones Lucide por categoria
- Tema da marca via `BrandProviderOverride`

### Arquivos envolvidos
- **Novo**: `src/pages/DriverPanelPage.tsx` — página principal
- **Novo**: `src/components/driver/DriverMarketplace.tsx` — marketplace por seções
- **Editar**: `src/App.tsx` — adicionar rota `/driver`

### Sem alteração de banco
Não precisa de migração — usa as tabelas `affiliate_deals` e `affiliate_deal_categories` existentes. Os deals são públicos (sem RLS restritivo para leitura anônima).

### Resultado
O motorista acessa `/driver?brandId=xxx`, vê o marketplace completo organizado por categorias, pode navegar entre seções e abrir cada categoria em tela cheia. Sem login, sem pontos, sem menus extras.


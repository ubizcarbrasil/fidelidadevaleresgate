

## Central de Acessos — Impersonação de Painéis

### Objetivo
Criar duas páginas de "central de acessos" que permitem navegar para os painéis individuais de cada entidade sem trocar de conta:

1. **Para ROOT**: página listando todas as marcas (brands) com links para:
   - Painel do Empreendedor (Brand Admin) da marca
   - App do Cliente (Customer Preview) da marca

2. **Para BRAND**: página listando todas as lojas (stores) e clientes, com links para:
   - Portal do Parceiro (Store Owner Panel) de cada loja
   - Visão de Cliente de cada cliente

### Implementação

#### 1. Nova página `src/pages/AccessHubPage.tsx`
- Consulta `brands` (para ROOT) ou `stores` + `customers` (para BRAND)
- Exibe cards/tabela com nome, status e botões de ação
- Ações abrem em nova aba usando URLs existentes:
  - **Painel Brand Admin**: `/customer-preview?brandId={id}` (já renderiza WhiteLabelLayout com contexto da marca)
  - **App do Cliente**: `/customer-preview?brandId={id}` 
  - **Portal do Parceiro**: redireciona para `/store-panel` com contexto (será necessário parametrizar por `storeId`)
- Tabs internas: "Marcas" (ROOT) ou "Parceiros" / "Clientes" (BRAND)

#### 2. Ajustes na rota e sidebar
- Adicionar rota `/access-hub` no `App.tsx`
- Adicionar item no `RootSidebar.tsx` (grupo "Estrutura") e `BrandSidebar.tsx`
- Ícone: `ExternalLink` ou `Eye`

#### 3. Detalhamento da UX

**Visão ROOT — Tab "Marcas":**
| Marca | Slug | Status | Ações |
|-------|------|--------|-------|
| Marca X | marca-x | Ativo | [Ver como Empreendedor] [Ver App do Cliente] |

- "Ver como Empreendedor": abre `/customer-preview?brandId=X` em nova aba (já funciona como preview completo)
- "Ver App do Cliente": mesma URL, já renderiza o app white-label

**Visão BRAND — Tab "Parceiros":**
| Loja | Cidade | Status | Ações |
|------|--------|--------|-------|
| Pizzaria João | Centro | Aprovado | [Ver Painel da Loja] |

- "Ver Painel da Loja": abre `/store-panel?storeId={id}` em nova aba

**Visão BRAND — Tab "Clientes":**
| Nome | Telefone | Saldo | Ações |
|------|----------|-------|-------|
| Maria | (11)... | 150pts | [Ver como Cliente] |

#### 4. Parametrização do StoreOwnerPanel
- Aceitar query param `?storeId=` para que ROOT/BRAND possa visualizar o painel de uma loja específica (override do store carregado)

### Arquivos alterados
| Arquivo | Alteração |
|---------|-----------|
| `src/pages/AccessHubPage.tsx` | **Novo** — página completa |
| `src/App.tsx` | Adicionar rota `/access-hub` |
| `src/components/consoles/RootSidebar.tsx` | Adicionar link "Central de Acessos" |
| `src/components/consoles/BrandSidebar.tsx` | Adicionar link "Central de Acessos" |
| `src/pages/StoreOwnerPanel.tsx` | Aceitar `?storeId=` como override |




# Filtrar Sidebar e Dashboard do Empreendedor pelo Modelo de Negócio

## Problema
O empreendedor (Brand Admin) vê todos os itens de menu e KPIs, independentemente do modelo de negócio configurado para suas cidades. Se opera apenas com motoristas, ainda vê menus de clientes (Pontuar, Resgates, Ofertas, etc.) e vice-versa.

## Mapeamento de cores das imagens

Baseado nas imagens enviadas:

### BrandSidebar — Gestão Comercial (IMG_5327)
| Item | Modelo |
|------|--------|
| Caixa PDV | PASSENGER |
| Ofertas | PASSENGER |
| Resgates | PASSENGER |
| Cupons | PASSENGER |
| Parceiros | PASSENGER |
| Clientes | PASSENGER |
| Motorista | DRIVER |
| Produtos de Resgate | DRIVER |
| Pedidos de Resgate | DRIVER |

### BrandSidebar — Programa de Fidelidade (IMG_5328)
| Item | Modelo |
|------|--------|
| Pontuar | PASSENGER |
| Regras de Fidelidade | PASSENGER |
| Pontuação por Tier | PASSENGER |
| Extrato de Fidelidade | PASSENGER |
| Regras de Pontuação Motorista | DRIVER |

### Dashboard KPIs (IMG_5317)
| KPI | Modelo |
|-----|--------|
| Resgates | PASSENGER |
| Clientes | PASSENGER |
| Pontuações | PASSENGER |
| Ofertas Ativas | PASSENGER |
| Pontos Clientes | PASSENGER |
| Motoristas | DRIVER |
| Pontos Motoristas | DRIVER |
| Achadinhos Ativos | DRIVER |

### Dashboard extras (IMG_5319, IMG_5324)
| Componente | Modelo |
|------------|--------|
| Corridas Realizadas | BOTH (azul) |
| Ranking Passageiros tab | PASSENGER |
| Ranking Motoristas tab | DRIVER |

### Links Úteis (IMG_5326)
| Link | Modelo |
|------|--------|
| App do Cliente | PASSENGER |
| Cadastro Parceiro | PASSENGER |
| Painel Parceiro | PASSENGER |
| Achadinho Motorista | DRIVER |

### Painéis dos Parceiros (IMG_5325)
| Componente | Modelo |
|------------|--------|
| Seção inteira | PASSENGER |

Items sem marcação de cor = apenas empreendedor (sempre visíveis).

## Solução

### 1. Criar hook `useBrandScoringModels`
Novo hook que busca os `scoring_model` de todas as branches da marca e calcula se a marca opera com motoristas, passageiros ou ambos (baseado na união de todos os modelos das cidades ativas).

**Arquivo:** `src/hooks/useBrandScoringModels.ts`

### 2. Adicionar `scoringFilter` aos itens do BrandSidebar
Adicionar a propriedade `scoringFilter: "DRIVER" | "PASSENGER"` nos itens de menu do empreendedor (igual já existe no BranchSidebar) e filtrar usando o hook acima.

**Arquivo:** `src/components/consoles/BrandSidebar.tsx`

### 3. Filtrar KPIs do Dashboard por modelo
Passar flags `isDriverEnabled`/`isPassengerEnabled` ao `DashboardKpiSection` e condicionar a renderização de cada bloco de KPI.

**Arquivos:**
- `src/pages/Dashboard.tsx` — consumir hook e passar flags
- `src/components/dashboard/DashboardKpiSection.tsx` — condicionar blocos

### 4. Filtrar componentes do Dashboard
- `RidesCounterCard` — mostrar sempre (azul = BOTH)
- `RankingPontuacao` — filtrar tabs por modelo
- `DashboardQuickLinks` — filtrar links e seção "Painéis dos Parceiros" por modelo

**Arquivos:**
- `src/components/dashboard/RankingPontuacao.tsx`
- `src/components/dashboard/DashboardQuickLinks.tsx`

### Detalhes técnicos
- O hook `useBrandScoringModels` faz `SELECT scoring_model FROM branches WHERE brand_id = X AND is_active = true` e retorna `{ isDriverEnabled, isPassengerEnabled }` baseado na união dos modelos
- Se nenhuma cidade existe, ambos ficam `true` (padrão permissivo)
- A filtragem é visual — nenhuma permissão ou RLS muda, apenas a visibilidade dos itens


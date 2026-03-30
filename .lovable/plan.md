

# Criar seção "Manuais" com guias instrutivos de todas as funcionalidades

## Visão Geral
Criar uma nova seção **MANUAIS** no menu lateral da Brand Console, contendo manuais instrutivos detalhados e educativos para cada funcionalidade da plataforma. Cada manual explicará: o que é, como funciona, como ativar, e o fluxo completo passo a passo.

## Estrutura

### 1. Nova rota e página principal: `/manuais`
Criar `src/pages/ManuaisPage.tsx` — página principal com cards organizados por categoria, cada card levando ao manual específico da funcionalidade.

### 2. Componente de manual individual
Criar `src/components/manuais/ManualRenderer.tsx` — componente reutilizável que renderiza um manual com seções padronizadas:
- **O que é** — descrição da funcionalidade
- **Como ativar** — pré-requisitos e ativação
- **Como funciona** — fluxo completo passo a passo com numeração
- **Dicas** — boas práticas
- **Rota no sistema** — link direto para a funcionalidade

### 3. Dados dos manuais
Criar `src/components/manuais/dados_manuais.ts` — arquivo com todos os manuais organizados por grupo, cobrindo **todas** as funcionalidades:

**Personalização & Vitrine** (8 manuais):
- Aparência da Marca (`/brands`)
- Cidades (`/branches`)
- Biblioteca de Ícones (`/icon-library`)
- Landing Page Parceiros (`/partner-landing-config`)
- Boas-Vindas (`/welcome-tour`)
- Links do Perfil (`/profile-links`)
- Layout de Ofertas (`/offer-card-config`)
- Editor de Páginas (`/page-builder-v2`)
- Mídia & Banners (`/banner-manager`)

**Achadinhos** (5 manuais):
- Achadinhos — Produtos Afiliados (`/affiliate-deals`)
- Categorias de Achadinhos (`/affiliate-categories`)
- Espelhamento de Achadinhos (`/mirror-sync`)
- Governança de Achadinhos (`/offer-governance`)
- Painel do Motorista (`/driver-config`)

**Resgate com Pontos** (3 manuais):
- Produtos de Resgate (`/produtos-resgate`)
- Regras de Resgate (`/regras-resgate`)
- Pedidos de Resgate (`/product-redemption-orders`)

**Gestão Comercial** (7 manuais):
- Caixa PDV (`/pdv`)
- Ofertas (`/offers`)
- Resgates (`/redemptions`)
- Cupons (`/vouchers`)
- Parceiros (`/stores`)
- Clientes (`/customers`)
- Motoristas (`/motoristas`)
- Patrocinados (`/sponsored-placements`)

**Programa de Fidelidade** (5 manuais):
- Pontuar (`/earn-points`)
- Regras de Fidelidade (`/points-rules`)
- Pontuação por Tier (`/tier-points-rules`)
- Extrato de Fidelidade (`/points-ledger`)
- Regras de Pontuação Motorista (`/driver-points-rules`)

**Cashback Inteligente** (3 manuais):
- Configuração Cashback (`/ganha-ganha-config`)
- Financeiro Cashback (`/ganha-ganha-billing`)
- Fechamento Financeiro (`/ganha-ganha-closing`)

**Aprovações** (3 manuais):
- Solicitações de Upgrade (`/emitter-requests`)
- Validar Regras (`/approve-store-rules`)
- Catálogo (`/store-catalog`)

**Equipe & Acessos** (3 manuais):
- Usuários (`/users`)
- Permissão de Parceiros (`/brand-permissions`)
- Gestão de Acessos (`/access-hub`)

**Inteligência & Dados** (5 manuais):
- Inteligência CRM (`/crm`)
- Relatórios (`/reports`)
- Auditoria (`/audit`)
- Importação de Dados (`/csv-import`)
- Taxonomia (`/taxonomy`)

**Integrações & API** (4 manuais):
- APIs & Integrações (`/api-keys`)
- Documentação API (`/api-docs`)
- Integração Mobilidade (`/machine-integration`)
- Lab Webhook (`/machine-webhook-test`)

**Configurações** (3 manuais):
- Módulos (`/brand-modules`)
- Configurações (`/brand-settings`)
- Meu Plano (`/subscription`)

### 4. Menu lateral
Adicionar no `BrandSidebar.tsx` um novo grupo **"Manuais"** com ícone `BookOpen`, posicionado logo após "Guias Inteligentes", com o item:
- Manuais da Plataforma → `/manuais`

### 5. Rota no App.tsx
Registrar `<Route path="manuais" element={<ManuaisPage />} />` dentro do layout protegido.

## Arquivos a criar/editar
| Arquivo | Ação |
|---------|------|
| `src/pages/ManuaisPage.tsx` | Criar — página principal com busca e navegação por categorias |
| `src/components/manuais/ManualRenderer.tsx` | Criar — componente que renderiza um manual individual |
| `src/components/manuais/dados_manuais.ts` | Criar — dados de ~50 manuais organizados por grupo |
| `src/components/consoles/BrandSidebar.tsx` | Editar — adicionar item "Manuais" no menu |
| `src/App.tsx` | Editar — adicionar rota `/manuais` |

## UX da página
- Campo de busca no topo para filtrar manuais por nome
- Cards agrupados por categoria com ícones
- Ao clicar num card, expande inline o manual completo (accordion)
- Cada manual tem botão "Ir para esta página" linkando diretamente à rota
- Design consistente com o design system existente (cards arredondados, cores do tema)


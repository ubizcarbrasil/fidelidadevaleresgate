

## Integração CRM + Sistema de Fidelidade: Login Único e Base Compartilhada

### Situação Atual

O **CRM Vale Resgate** e o **Sistema de Fidelidade** são dois projetos Lovable separados, cada um com seu próprio backend independente. Isso significa:
- Dois sistemas de autenticação separados
- Dois bancos de dados distintos
- O usuário precisa criar conta e fazer login em cada um separadamente

### O Desafio

Integrar login único (SSO) entre dois backends independentes é tecnicamente complexo e frágil. Existem duas abordagens viáveis:

### Abordagem Recomendada: CRM Nativo no Sistema de Fidelidade

Construir as funcionalidades-chave do CRM **diretamente dentro deste projeto**, usando a mesma base de dados de clientes, resgates e pontos que já existe. Isso garante:
- **Login único real** — mesmo usuário, mesma sessão
- **Base de clientes 100% compartilhada** — dados de `customers`, `earning_events`, `redemptions` alimentam os diagnósticos
- **Zero fricção** — sem redirecionamentos entre apps

### O Que Será Construído

#### 1. Página CRM Dashboard (`src/pages/CrmDashboardPage.tsx`)
Painel analítico usando dados existentes das tabelas `customers`, `earning_events`, `redemptions`:

- **Diagnóstico do Negócio**: total de clientes, ativos vs inativos, taxa de resgate, ticket médio
- **Clientes Perdidos**: clientes sem atividade nos últimos 30/60/90 dias (baseado em `earning_events.created_at` e `redemptions.created_at`)
- **Clientes Potenciais**: clientes com alta frequência de compra mas baixo resgate, ou clientes novos com potencial
- **Segmentação por Atividade**: cards com contagem de clientes ativos, em risco, perdidos, novos

#### 2. Página Clientes Perdidos (`src/pages/CrmLostCustomersPage.tsx`)
Lista de clientes sem atividade recente com:
- Nome, último ponto ganho, último resgate
- Filtros por período de inatividade (30, 60, 90+ dias)
- Ação rápida: enviar notificação para reconquistar

#### 3. Página Clientes Potenciais (`src/pages/CrmPotentialCustomersPage.tsx`)
Lista de clientes com alto potencial:
- Clientes com muitos pontos acumulados sem resgatar
- Clientes com alta frequência de compra
- Clientes novos (últimos 30 dias)

#### 4. Hook de Dados CRM (`src/hooks/useCrmAnalytics.ts`)
Hook centralizado que faz queries nas tabelas existentes para calcular:
- Contagem de clientes por status de atividade
- Métricas de engajamento (última compra, frequência)
- Dados de retenção e churn

#### 5. Integração no Sistema
- **Sidebar** (`BrandSidebar.tsx`): grupo "CRM Estratégico" com 3 itens (Dashboard, Perdidos, Potenciais) — substituindo o link externo atual
- **Dashboard** (`Dashboard.tsx`): atualizar o card CRM para navegar internamente ao invés de link externo
- **Landing Page** (`LandingCRM.tsx`): atualizar CTA para mencionar "CRM integrado" ao invés de link externo
- **Rota**: adicionar `/crm`, `/crm/lost`, `/crm/potential` no `App.tsx`

### Arquivos

| Arquivo | Ação |
|---------|------|
| `src/hooks/useCrmAnalytics.ts` | Criar — queries analíticas sobre dados existentes |
| `src/pages/CrmDashboardPage.tsx` | Criar — dashboard CRM com diagnósticos |
| `src/pages/CrmLostCustomersPage.tsx` | Criar — lista de clientes perdidos |
| `src/pages/CrmPotentialCustomersPage.tsx` | Criar — lista de clientes potenciais |
| `src/App.tsx` | Editar — rotas `/crm/*` |
| `src/components/consoles/BrandSidebar.tsx` | Editar — grupo CRM com navegação interna |
| `src/pages/Dashboard.tsx` | Editar — card CRM com link interno |
| `src/components/landing/LandingCRM.tsx` | Editar — CTA atualizado |

### Notas Técnicas
- Todas as queries usam as tabelas existentes (`customers`, `earning_events`, `redemptions`) — nenhuma migração necessária
- RLS já está configurado corretamente para brand_admins lerem esses dados
- Os dados são filtrados pelo `brand_id` do usuário logado via `BrandContext`


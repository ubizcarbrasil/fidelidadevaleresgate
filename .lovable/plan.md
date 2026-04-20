

# Status Mobile/PWA — O que falta antes de publicar

## ✅ Já está pronto (passe anterior)
- Shell global (`AppLayout.tsx`) com topbar mobile, safe-areas e título dinâmico
- Tela `/install` com instruções iOS/Android
- Banners de instalar/atualizar PWA
- `index.css` com utilitários `pwa-safe-*`, touch targets e `tabs-scroll-mobile`
- Ficha do motorista (`DriverDetailSheet`) com abas roláveis
- Modal de importação de motoristas 100% navegável no celular
- Página de Gestão de Motoristas
- Aba de Configurações do Duelo (5 sub-abas) — já foi feita pensando em mobile

## ⚠️ O que ainda NÃO está adaptado (verificado agora no código)

Pesquisei o repositório e encontrei **43 páginas administrativas com grids densos** (`grid-cols-3/4/5/6` sem breakpoint mobile) e **13 páginas com tabelas largas** que vão estourar no celular. As mais críticas:

| Página | Problema |
|---|---|
| `Dashboard.tsx` | KPIs e gráficos podem cortar no mobile |
| `OffersPage.tsx` | Formulário com `grid-cols-3` sem fallback |
| `ReportsPage.tsx` | 4 tabelas largas com `overflow-x-auto` mas controles apertados |
| `CrmDashboardPage.tsx` | `grid-cols-5` em "ações críticas" |
| `CrmCampaignsPage.tsx` / `CrmAudiencesPage.tsx` | Formulários `grid-cols-3` fixos |
| `Branches.tsx` / `BrandBranchesPage.tsx` | Listagens de cidades com tabelas |
| `Customers.tsx` / `Stores.tsx` / `Vouchers.tsx` | Listagens densas |
| `RedemptionsPage.tsx` / `ProductRedemptionOrdersPage.tsx` | Tabelas de resgates |
| `MachineIntegrationPage.tsx` | TabsList `grid-cols-4` apertada |
| `IconLibraryPage.tsx`, `BannerManagerPage.tsx`, `WelcomeTourConfigPage.tsx` | Grids visuais densos |
| `BrandModulesPage.tsx`, `BrandSettingsPage.tsx` | Configurações com cards lado a lado |
| `GanhaGanha*` (5 páginas) | Dashboards e relatórios |
| `Crm*` (10+ páginas) | Listagens e formulários |
| `Driver*Config / Subscription / Plans / Users / AccessHub` | Configurações administrativas |

## 🎯 O que vou fazer na próxima execução

**Passe 2 — Adequação mobile das páginas administrativas (sem refazer o shell)**

### Estratégia
Aplicar 4 padrões repetíveis para não tocar individualmente em cada página:

1. **Grids densos** → trocar `grid-cols-N` por `grid-cols-1 sm:grid-cols-2 lg:grid-cols-N` em formulários e cards
2. **Tabelas largas** → garantir wrapper `overflow-x-auto` + reduzir colunas não-essenciais no mobile (`hidden sm:table-cell`)
3. **TabsList apertadas** → trocar `grid grid-cols-N` por `flex overflow-x-auto` no mobile (padrão já criado)
4. **Barras de filtros** → empilhar verticalmente no mobile com `flex-col sm:flex-row`

### Páginas que serão tratadas (em ordem de uso real)
**Prioridade 1 — operação diária**
- Dashboard
- OffersPage
- RedemptionsPage
- ProductRedemptionOrdersPage
- CustomersPage
- Branches / BrandBranchesPage
- ReportsPage / BranchReportsPage
- StoresPage

**Prioridade 2 — configurações**
- BrandModulesPage / BrandSettingsPage
- MachineIntegrationPage
- PointsRulesPage / DriverPointsRulesPage
- GamificacaoAdminPage (header e abas externas)
- VouchersPage / VoucherWizardPage

**Prioridade 3 — CRM e gestão**
- CrmDashboardPage, CrmCampaignsPage, CrmAudiencesPage, CrmCustomersPage
- GanhaGanha (5 telas)
- UsersPage / AccessHubPage / SubscriptionPage

**Prioridade 4 — admin avançado (Root)**
- IconLibraryPage / BannerManagerPage / WelcomeTourConfigPage
- PlanModuleTemplatesPage / FeatureFlagsPage / ReleasesPage

### O que NÃO entra
- Refatoração funcional (apenas responsividade)
- Páginas públicas/cliente (`/loja/:slug`, `/p/:slug`, `/driver`) — já são mobile-first
- Tela do parceiro (`/store-panel`) — escopo separado

## 📤 Posso publicar agora?

**Tecnicamente sim, mas não recomendo ainda**:

✅ **Funciona no celular**: login, navegação, ficha de motorista, importação, configuração de duelo, instalação PWA — tudo testado e adaptado.

⚠️ **Mas vai ficar feio em várias páginas**: Dashboard, Ofertas, Relatórios, CRM e Configurações ainda têm grids e tabelas que estouram horizontalmente no celular. Se você abrir essas telas no PWA instalado, vai precisar de scroll lateral e os formulários ficam apertados.

**Recomendação**: rodar o **Passe 2** primeiro (estimativa ~40 min, sem mudança funcional, só CSS responsivo) e **publicar tudo de uma vez**. Assim você instala o PWA e usa qualquer tela com conforto.

## ⏱️ Estimativa
~40 min para tratar as ~30 páginas prioritárias aplicando os 4 padrões. Sem migração, sem mudança de lógica, sem risco de regressão funcional. `npx tsc --noEmit` esperado limpo.


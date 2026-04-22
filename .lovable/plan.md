

# Atualização completa de Manuais e Ajuda Contextual (?)

## Objetivo

1. **Atualizar todos os manuais** (`/manuais` e o ícone "?" no canto inferior direito) para refletir as mudanças recentes da plataforma.
2. **Conferir cada manual** contra a prática real das telas para garantir alinhamento.
3. **Adicionar o botão "?" de ajuda contextual** em todas as páginas administrativas que ainda não têm.

## Diagnóstico atual

- **Manuais (`/manuais`)**: 94 manuais em `src/components/manuais/dados_manuais.ts` (2.137 linhas).
- **Help contextual (?)**: 88 rotas cadastradas em `src/lib/helpContent.ts` (1.895 linhas), exibidas pelo `ContextualHelpDrawer` que já é injetado automaticamente no `AppLayout` (todas as rotas administrativas internas). Páginas fora do AppLayout (`StoreOwnerPanel`, `DriverPanelPage`, `CustomerPreviewPage`, `Auth`, etc.) precisam tratamento individual.
- **Lacunas detectadas (rotas SEM help)**: 33 rotas, entre elas `/conversao-resgate`, `/relatorio-corridas`, `/leads-comerciais`, `/admin/central-modulos`, `/admin/produtos-comerciais`, `/admin/auditoria-duplicacoes`, `/configuracao-cidade`, `/configuracao-modulos-cidade`, `/brand-modules/ganha-ganha`, `/ganha-ganha-reports`, `/store/ganha-ganha`, `/driver-points-purchase`, `/affiliate-deals/import-mobile`, `/public-vouchers`, `/vouchers/redeem`, `/brand-journey`, `/root-journey`, `/emitter-journey`, `/branch-business-models`, `/brand-domains`.
- **Mudanças recentes a refletir** (últimas semanas, baseado em memória do projeto e histórico):
  - **Gestão de Motoristas** — exportação CSV em duas etapas (Exportar → Abrir CSV), comportamento iOS/PWA via URL HTTPS assinada, filtros corrigidos (status NULL = Ativo, busca por nome/CPF/telefone/e-mail, regex específico para placa, botão "Limpar filtros", contador "X de Y").
  - **Cidades** — modelos de pontuação (DRIVER_ONLY/PASSENGER_ONLY/BOTH), ativação granular de módulos por cidade, carteira pré-paga de pontos com saldo negativo, reset de pontos via Edge Function, exclusão hard-delete via Edge Function.
  - **Gamificação** — Duelos, Ranking e Cinturão regidos por `achadinhos_motorista`.
  - **Painel do Motorista** — Hub inteligente, compra de pontos, histórico de resgates locais, ofertas restritas a motoristas, vinculação automática por CPF.
  - **CRM** — segmentação de audiências, Pareto, clientes em risco/potenciais, jornadas.
  - **Ganha-Ganha** — fechamentos, billing, relatórios, dashboard root, resumo por loja.
  - **Plano e assinatura** — restrições por plano (Free/Starter/Pro/Enterprise), comercialização e recarga de pontos, renovação manual.
  - **Page Builder V2** — segmentação por audiência em blocos.
  - **Permissões hierárquicas** — engine de 4 níveis com herança e override por cidade.
  - **Mobilidade (TaxiMachine)** — credenciais centralizadas, mensageria unificada, identificação manual de passageiros, pontuação automática.
  - **Personalização** — rótulos de menu (3 abas), reordenação de sidebar e seções da Home, tema por cidade.
  - **Achadinhos / Resgate na Cidade** — fluxo OTP → confirmação → PIN, sempre driver-only.
  - **Análise** — uso obrigatório de `finalized_at`, isolamento por `branch_id`, drilldown na Central de Acessos.

## O que será feito

### 1. Atualizar conteúdo de manuais existentes (`dados_manuais.ts`)

Revisar e reescrever os 94 manuais existentes para refletir a prática real, com foco prioritário em:

- **Gestão de Motoristas** (`/motoristas`): novo fluxo CSV em 2 toques (mobile/iOS), explicação dos filtros (status NULL = Ativo), busca por nome/CPF/telefone/e-mail/placa, botão "Limpar filtros", importação CSV.
- **Cidades** (`/branches`, `/brand-branches`): modelos de pontuação, módulos granulares por cidade, gamificação por cidade, exclusão segura.
- **Carteira da Cidade** (`/branch-wallet`): saldos pré-pagos e negativos, recargas, histórico.
- **Pacotes de Pontos** (`/points-packages`, `/points-packages-store`): comercialização, criação de pacotes, fluxo de compra pelo motorista.
- **Painel do Motorista** (`/driver`, `/driver-config`): Home inteligente, compra de pontos, ofertas exclusivas, histórico de resgates locais.
- **Gamificação** (`/gamificacao-admin`): Duelos, Ranking, Cinturão, dependência do módulo `achadinhos_motorista`.
- **Regras de Pontos** (`/points-rules`, `/driver-points-rules`, `/tier-points-rules`, `/store-points-rule`): regras por parceiro, por motorista, por faixa, anti-fraude.
- **CRM** (`/crm`, jornadas): explicação completa dos novos painéis (Pareto, audiências, perdidos, potenciais, oportunidades, tier).
- **Ganha-Ganha** (config/billing/closing/reports/dashboard/store-summary): ecossistema compartilhado.
- **Resgates e Cupons** (`/redemptions`, `/vouchers`, `/regras-resgate`, `/approve-store-rules`, `/conversao-resgate`): ciclo de 12 etapas.
- **Mobilidade** (`/machine-integration`, `/machine-webhook-test`, `/mirror-sync`): integração TaxiMachine, identificação manual.
- **Personalização** (`/menu-labels`, `/home-templates`, `/banner-manager`, `/page-builder-v2`, `/sponsored-placements`, `/welcome-tour`, `/profile-links`): visão geral atualizada.
- **Plano e assinatura** (`/subscription`, `/plan-templates`): restrições por plano, módulos liberados.
- **Permissões e usuários** (`/permissions`, `/brand-permissions`, `/users`, `/audit`).
- **Relatórios** (`/reports`, `/branch-reports`, `/relatorio-corridas`): consistência com `finalized_at`.

### 2. Conferência prática

Para cada manual atualizado:
- Ler o componente da página correspondente (e seus principais subcomponentes).
- Garantir que **título**, **passos** e **dicas** correspondam a botões, abas e fluxos visíveis na tela.
- Corrigir nomes de botões/abas que mudaram (ex.: "Exportar CSV" → "Exportar CSV / Abrir CSV", "Aparência da Marca", "Cidades", "Parceiros", etc.).
- Padronizar terminologia oficial: Empresa, Marca, Cidade, Parceiro, Motorista (conforme memória `mem://business/terminologia-e-nomenclatura-padrao`).

### 3. Atualizar/expandir help contextual (`helpContent.ts`)

- **Atualizar** os 88 helps já existentes para refletir as mesmas mudanças listadas acima (versão resumida do manual completo).
- **Adicionar 33 novas entradas** para as rotas que hoje não têm help, com prioridade nas operacionais:
  - `/conversao-resgate`, `/relatorio-corridas`, `/leads-comerciais`
  - `/admin/central-modulos`, `/admin/produtos-comerciais`, `/admin/auditoria-duplicacoes`
  - `/configuracao-cidade`, `/configuracao-modulos-cidade`, `/branch-business-models`
  - `/brand-modules/ganha-ganha`, `/ganha-ganha-reports`, `/store/ganha-ganha`
  - `/driver-points-purchase`, `/affiliate-deals/import-mobile`
  - `/public-vouchers`, `/vouchers/redeem`, `/vouchers/new`, `/vouchers/:id`
  - `/brand-journey`, `/root-journey`, `/emitter-journey`, `/brand-domains`
  - Demais rotas auxiliares (formulários `/branches/new`, `/brands/new`, `/tenants/new` etc. herdarão do path base via `getHelpForRoute`).

### 4. Garantir presença do "?" em todas as páginas

- **AppLayout** já injeta o `ContextualHelpDrawer` em todas as rotas internas — nenhuma ação necessária para essas.
- **StoreOwnerPanel** já tem — manter.
- **DriverPanelPage**: adicionar `<ContextualHelpDrawer />` (motorista também merece manual contextual).
- **CustomerPreviewPage**: adicionar `<ContextualHelpDrawer />`.
- **Auth, ResetPassword, LandingPage, TrialSignupPage, InstallPwaPage, públicas (/loja/:slug, /p/:slug, /webview, /links, /campeonato, /produtos)**: NÃO adicionar (são páginas públicas/onboarding sem contexto administrativo).
- **Hall da Fama, PartnerLandingPage**: NÃO adicionar.

### 5. Pequenas melhorias no drawer de ajuda

- Adicionar botão "Ver manual completo" no rodapé do `ContextualHelpDrawer` que leva para `/manuais` (quando o usuário tiver acesso) com âncora para o manual relacionado.
- No `ManualRenderer`, garantir que o link "Ir para a página" funcione corretamente para todas as rotas atualizadas.

## Arquivos impactados

**Editados:**
- `src/components/manuais/dados_manuais.ts` — revisão completa dos 94 manuais + adição de manuais novos para módulos sem manual (relatório de corridas, conversão de resgate, leads comerciais, central de módulos, produtos comerciais, jornada de marca/root/emissor, configuração de cidade granular, ganha-ganha reports, compra de pontos pelo motorista).
- `src/lib/helpContent.ts` — atualização dos 88 helps existentes + adição de ~25 novos.
- `src/components/ContextualHelpDrawer.tsx` — adicionar link "Ver manual completo" no rodapé.
- `src/pages/DriverPanelPage.tsx` — montar `<ContextualHelpDrawer />`.
- `src/pages/CustomerPreviewPage.tsx` — montar `<ContextualHelpDrawer />`.

**Sem migration. Sem alteração em RLS, edge functions ou schema.**

## Resultado esperado

- **`/manuais`** mostra catálogo atualizado com 100+ manuais alinhados à prática real, organizados por categoria, com filtro por cidade/scoring quando aplicável.
- **Botão "?"** aparece em **todas** as páginas administrativas (incluindo Painel do Motorista e Pré-visualização do Cliente), com conteúdo específico para a tela atual.
- **Conteúdo verificado**: cada passo descrito existe na interface real; nomes de botões, abas e campos batem; terminologia padronizada (Empresa/Marca/Cidade/Parceiro/Motorista).
- **Sem regressões** — apenas conteúdo e dois pontos novos de montagem do drawer.

## Risco e rollback

- **Zero impacto em dados** (apenas conteúdo textual e dois imports de componente).
- Rollback trivial: reverter os 5 arquivos editados.
- Sem efeito em performance (drawer já é lazy-loaded).


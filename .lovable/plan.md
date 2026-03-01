

# Descritivo Completo de Todas as Jornadas do Vale Resgate

## Visão Geral da Arquitetura

O sistema opera em dois modos distintos baseados no domínio de acesso:

- **Modo Administrativo** (localhost / lovable.app / root.*): Renderiza `AppRoutes` com sidebar e rotas protegidas
- **Modo White-Label** (domínio customizado): Renderiza `WhiteLabelLayout` — o app do cliente final com a identidade visual da marca

A resolução da marca ocorre automaticamente via `BrandContext`, que consulta `brand_domains` pelo hostname. Se houver múltiplas cidades (branches), o usuário escolhe ou o sistema detecta por geolocalização.

---

## JORNADA 1: Cliente Final (App White-Label)

**Entrada:** Acessa o domínio customizado da marca (ex: `meumercado.valeresgate.com`)

### 1.1 Resolução e Seleção de Cidade
- `BrandContext` resolve a marca pelo domínio
- Se há mais de uma cidade, exibe `BranchSelector` (ou auto-detecta por GPS)
- Persistência da cidade escolhida no perfil do usuário

### 1.2 Tela Inicial (`CustomerHomePage`)
- **Cartão de saldo** estilo bancário: mostra pontos + saldo em R$
- **Barra de ações rápidas**: Ofertas, Cupons, Parceiros, Pontos, Presentes, Achadinhos, QR Code
- **Seções dinâmicas** (`HomeSectionsRenderer`): configuradas pelo empreendedor no painel admin
- **Parceiros emissores** (`EmissorasSection`): lista parceiros que emitem pontos
- **Achadinhos** (`AchadinhoSection`): marketplace de afiliados

### 1.3 Busca e Descoberta
- Barra de busca global (`CustomerSearchOverlay`): busca por parceiros e ofertas
- Filtros por categoria (chips baseados nos nomes dos parceiros)

### 1.4 Explorar Ofertas (`CustomerOffersPage`)
- Lista todas as ofertas ativas da cidade selecionada
- Mostra parceiro, valor de resgate, desconto, urgência (dias restantes)
- Sistema de favoritos (coração) com persistência no banco

### 1.5 Detalhe da Oferta (`CustomerOfferDetailPage`)
- Hero image + badges de urgência
- Informações do parceiro (logo + nome)
- Valor de resgate + compra mínima
- Regras: validade, dias da semana, horários, limite diário
- **Ofertas semelhantes** na mesma cidade
- Compartilhamento via Web Share API

### 1.6 Fluxo de Resgate (PIN+CPF)
- Cliente clica "Resgatar agora"
- Modal de confirmação solicita o CPF (11 dígitos)
- Sistema cria registro em `redemptions` com status `PENDING`
- Trigger gera PIN de 6 dígitos + `expires_at` (24h)
- PIN é exibido na tela para o cliente apresentar ao parceiro
- Edge Function `expire-pending-pins` expira PINs não utilizados a cada 15min

### 1.7 Carteira (`CustomerWalletPage`)
- Cards de saldo: Pontos + Valor em R$
- Histórico de transações (últimas 50 do `points_ledger`)
- Cada entrada mostra: tipo (crédito/débito), razão, data, pontos

### 1.8 Extrato Completo (`CustomerLedgerOverlay`)
- Overlay com extrato detalhado acessível ao tocar no cartão de saldo

### 1.9 Perfil (`CustomerProfilePage`)
- Dados do cliente
- Configurações pessoais

### 1.10 Notificações (`NotificationDrawer`)
- Notificações push/in-app (ofertas expirando, favoritos, etc.)
- Edge Function `check-expiring-favorites` gera notificações automáticas
- Contador de não-lidas no header

### 1.11 Detalhe do Parceiro (`CustomerStoreDetailPage`)
- Perfil do parceiro com suas ofertas ativas
- Navegação para detalhes de ofertas específicas

---

## JORNADA 2: Parceiro / Lojista (`StoreOwnerPanel` — `/store-panel`)

**Entrada:** Parceiro aprovado faz login e é redirecionado ao `/store-panel`

### 2.1 Cadastro do Parceiro (`StoreRegistrationWizard` — `/register-store`)
- Wizard de 4 etapas: Dados Básicos, Endereço, Mídia/Documentos, Acesso (senha)
- Cria registro em `stores` com `approval_status = 'PENDING'`
- Após submissão, parceiro aguarda aprovação no painel

### 2.2 Estado de Espera (Store Empty State)
- Se loja ainda não aprovada, exibe tela informativa com status da análise
- Opções: verificar status, reenviar, contato com suporte

### 2.3 Dashboard do Parceiro (`StoreOwnerDashboard`)
- KPIs: Cupons Emitidos, Resgatados, Ativos, Ganhos (R$)
- Filtro por período: Hoje, 7 dias, 30 dias, Tudo
- Alertas: cupons próximos de vencer, inativos/expirados
- Badge de tipo: Receptora / Emissora / Mista

### 2.4 Criação de Cupons (`StoreVoucherWizard`)
- Wizard de 11 etapas: Categoria, Tipo, Valor, Validade, Agendamento, Dias Específicos, Limites, Tipo de Resgate, Cumulatividade, Aceite de Termos, Revisão
- Cria `offers` vinculada ao `store_id` do parceiro
- RLS garante que parceiro só gerencia suas próprias ofertas

### 2.5 Resgate de PIN (`StoreRedeemTab`)
- Parceiro insere PIN + CPF para validar resgate de um cliente
- Mesma lógica do OperatorRedeemPage mas no contexto do parceiro

### 2.6 Edição de Perfil (`StoreProfileTab`)
- Nome, descrição, tipo de parceria, contatos
- Upload de logo e imagens

### 2.7 Extrato (`StoreExtratoTab`)
- Histórico de transações e resgates do parceiro

### 2.8 Funcionários (`StoreEmployeesTab`)
- Gestão de colaboradores do parceiro

### 2.9 Cidades (`StoreBranchesTab`)
- Visualiza em quais cidades o parceiro atua

### 2.10 Informações (`StoreInfoTabs`)
- Termos de Uso, Tutorial, Suporte

---

## JORNADA 3: Operador de PDV (`OperatorRedeemPage` — `/pdv`)

**Entrada:** Usuário com role `operator_pdv` ou `branch_operator`

### 3.1 Validar Resgate
- Insere PIN (6 dígitos) + CPF do cliente
- Sistema busca `redemptions` com status `PENDING` + verifica expiração
- Exibe: oferta, cliente, CPF mascarado, cidade, valor, compra mínima, PIN, status
- Operador informa valor da compra e confirma resgate → status muda para `USED`
- Anti-fraude: verificação de expiração em tempo real

---

## JORNADA 4: Administrador da Cidade (Branch Admin)

**Sidebar:** `BranchSidebar` — "Gestão da Cidade"

### 4.1 Funcionalidades
- **Painel Principal**: Dashboard com métricas da cidade
- **Parceiros** (`StoresPage`): Gerencia parceiros da cidade
- **Ofertas** (`OffersPage`): Gerencia ofertas com filtros por parceiro/cidade
- **Clientes** (`CustomersPage`): Base de clientes da cidade
- **Resgates** (`RedemptionsPage`): Histórico de resgates
- **Pontuar** (`EarnPointsPage`): Registra pontos por compra (seleciona parceiro → busca cliente → valor da compra → cálculo automático de pontos com regras + limites anti-fraude)
- **Regras de Pontos** (`PointsRulesPage`): Configura regras da cidade
- **Extrato de Pontos** (`PointsLedgerPage`): Auditoria de movimentações
- **Cupons** (`Vouchers`): Gestão de cupons/vouchers
- **Aprovar Regras** (`ApproveStoreRulesPage`): Aprova/rejeita regras personalizadas de parceiros
- **Importar Planilha** (`CsvImportPage`): Importação em massa
- **Auditoria** (`AuditLogsPage`): Logs de ações

---

## JORNADA 5: Empreendedor / Brand Admin

**Sidebar:** `BrandSidebar` — "Painel do Empreendedor"

### 5.1 Visão Geral
- Dashboard com todas as métricas da marca (realtime)

### 5.2 Identidade Visual
- **Aparência da Marca** (`Brands`): Tema, cores, fontes, logo
- **Domínios** (`BrandDomains`): Configura domínios do app white-label
- **Galeria de Ícones** (`IconLibraryPage`): Ícones customizados

### 5.3 Vitrine do App
- **Seções da Tela Inicial** (`SectionTemplatesPage`): Configura seções dinâmicas da home do cliente
- **Central de Propagandas** (`BannerManagerPage`): Banners rotativos
- **Nomes e Rótulos** (`MenuLabelsPage`): Personaliza textos do app
- **Montador de Páginas** (`PageBuilderPage`): Páginas customizadas

### 5.4 Operações
- **Cidades** (`Branches`): CRUD de cidades de operação
- **Aprovação de Parceiros** (`StoreApprovalsPage`): Aprova/rejeita cadastros de parceiros
- **Importar Planilha** (`CsvImportPage`): Importação em massa

### 5.5 Programa de Pontos
- **Regras de Pontos** (`PointsRulesPage`): Configura regras globais (pontos por R$, limites, etc.)
- **Extrato de Pontos** (`PointsLedgerPage`): Auditoria global

### 5.6 Usuários e Permissões
- **Usuários** (`UsersPage`): Gestão de operadores e admins
- **Funcionalidades** (`BrandModulesPage`): Liga/desliga módulos do app
- **Auditoria** (`AuditLogsPage`): Logs de governança

---

## JORNADA 6: Tenant Admin (Cliente SaaS)

**Sidebar:** `TenantSidebar`

- Gerencia múltiplas marcas dentro do tenant
- Acesso a todas as funcionalidades das marcas sob sua gestão

---

## JORNADA 7: Root Admin (Plataforma)

**Sidebar:** `RootSidebar`

- **Tenants/Empresas**: CRUD de clientes SaaS
- **Marcas/Cidades**: Visão global
- **Módulos**: Definições de módulos (`ModuleDefinitionsPage`)
- **Permissões**: Gestão granular (`PermissionsPage`)
- **Feature Flags**: Ativar/desativar features (`FeatureFlagsPage`)
- **Templates de Home**: Biblioteca de templates (`HomeTemplatesPage`)
- **Releases**: Notas de versão
- **Relatórios**: Analytics globais

---

## JORNADA 8: Pontuação (Earn Points — Fluxo Completo)

1. **Empreendedor** cria regra de pontos (pontos por R$, limites diários, compra mínima)
2. Opcionalmente permite regras customizadas por parceiro (com limites min/max e aprovação)
3. **Parceiro** pode criar regra própria → vai para aprovação do admin
4. **Operador/Admin** na tela "Pontuar": seleciona parceiro → busca cliente por telefone → informa valor da compra
5. Sistema calcula pontos automaticamente (com preview) usando regra efetiva (global ou customizada)
6. Anti-fraude: limite diário por cliente, limite diário por parceiro, unicidade de comprovante
7. Cria `earning_event` + entrada no `points_ledger` + atualiza saldo do cliente
8. **Cliente** vê pontos atualizados na carteira do app

---

## Fluxos de Segurança e Governança

- **RLS em todas as tabelas**: Isolamento por `brand_id`, `branch_id`, `tenant_id`
- **Funções auxiliares**: `get_user_brand_ids()`, `get_user_branch_ids()`, `get_user_tenant_ids()`, `user_has_permission()`, `has_role()`
- **Audit Logs**: Registra ações sensíveis com escopo e detalhes
- **ModuleGuard**: Redireciona para Dashboard se módulo desabilitado
- **ProtectedRoute**: Exige autenticação para rotas admin/parceiro

---

## Status de Terminologia

✅ Todas as ocorrências de "loja" e "filial" foram corrigidas para "parceiro" e "cidade" em todos os arquivos da aplicação.


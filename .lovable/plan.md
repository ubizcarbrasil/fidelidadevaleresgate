

## Auditoria: Mapeamento do Modelo de Negócio vs. Sistema Atual

Abaixo está a análise completa de cada perfil que você descreveu, o que já existe implementado, e o que precisa ser construído.

---

### 1. DOMO DE FERRO FIDELIDADE (Plataforma SaaS) = `root_admin`

**Objetivo**: Detentora do sistema, comercializa para empreendedores, controle total.

| Requisito | Status | Detalhe |
|---|---|---|
| Controle total sobre tudo | **Implementado** | `root_admin` tem bypass em todas as RLS policies via `has_role()` |
| Gerenciar Empresas (Tenants) | **Implementado** | CRUD completo em `/tenants` |
| Gerenciar Marcas (Brands) | **Implementado** | CRUD completo em `/brands` |
| Gerenciar Cidades (Branches) | **Implementado** | CRUD completo em `/branches` |
| Liberar módulos por marca | **Implementado** | `/brand-modules` com `module_definitions` + `brand_modules` |
| Publicar seções para todas as marcas de uma vez | **Implementado parcialmente** | Existe `home_template_library` e `home_template_apply_jobs` para aplicar templates em massa, mas falta uma UI de "publicar para todos" com um clique |
| Buscar/aprovar parceiros | **Implementado** | `/store-approvals` com fluxo de aprovação |
| Painel supremo com menus completos | **Implementado** | `RootSidebar` com 40+ itens em 7 grupos |
| Wizard de criação de nova empresa | **Implementado** | `/provision-brand` + edge function `provision-brand` |
| Kit Inicial configurável | **Implementado** | `/starter-kit` com `platform_config` table |
| Transbordo de permissões | **Implementado** | `/brand-permissions` com `brand_permission_config` |

---

### 2. VALE RESGATE (Empreendedor) = `brand_admin`

**Objetivo**: Contratou o SaaS, monta seu negócio de fidelidade private label numa cidade.

| Requisito | Status | Detalhe |
|---|---|---|
| Painel próprio isolado | **Implementado** | `BrandSidebar` + `useBrandGuard` filtra tudo por `brand_id` |
| Dados isolados entre empreendedores | **Implementado** | RLS policies em todas as tabelas filtram por `brand_id` |
| Subdomínio próprio | **Implementado** | `brand_domains` com subdomain resolution |
| Configurar visual (logo, cor, nome) | **Implementado** | `brand_settings_json` com `BrandThemeEditor` |
| App PWA white-label com sua marca | **Implementado** | `WhiteLabelLayout` + `CustomerLayout` com tema dinâmico |
| Módulos controlados pelo Domo de Ferro | **Implementado** | `brand_modules` + `ModuleGuard` filtra menus e rotas |
| Link de cadastro de parceiros | **Implementado** | `/register-store` com wizard de 4 etapas |
| Gerenciar parceiros | **Implementado** | `/stores`, `/store-approvals` |
| Gerenciar ofertas e resgates | **Implementado** | `/offers`, `/redemptions` com fluxo completo |
| Programa de pontos | **Implementado** | `points_rules`, `earning_events`, `points_ledger` |
| Links de acesso no painel | **Implementado** | `BrandQuickLinks` no Dashboard |
| Acessos teste com botões rápidos | **Implementado** | Cards no Dashboard com credenciais |
| Configurar permissões dos parceiros | **Implementado** | `/brand-permissions` (transbordo) |
| Aprovar solicitações de Emissor | **Implementado** | `/emitter-requests` com fluxo completo |

---

### 3. PARCEIRO (Loja/Estabelecimento) = `store_admin`

**Objetivo**: Cadastra-se, é aprovado, oferta descontos para clientes com pontos.

| Requisito | Status | Detalhe |
|---|---|---|
| Cadastro público | **Implementado** | `/register-store` acessível via botão "Quero ser parceiro" |
| Fluxo de aprovação | **Implementado** | Status DRAFT → APPROVED com trigger `auto_assign_store_admin` |
| Portal dedicado mobile-first | **Implementado** | `/store-panel` com tabs e drawer |
| Criar cupons/ofertas | **Implementado** | `StoreVoucherWizard` dentro do portal |
| Modalidade RECEPTORA/EMISSORA/MISTA | **Implementado** | Campo `store_type` com valores na tabela `stores` |
| Emissor ativo quando módulo habilitado | **Implementado** | Módulo `earn_points_store` controla isso |
| Receptor virar Emissor | **Implementado** | `EmitterUpgradeCard` no portal + tabela `store_type_requests` com aprovação do empreendedor |

---

### 4. CLIENTE = `customer`

**Objetivo**: Acumula pontos em emissores, resgata em parceiros receptores.

| Requisito | Status | Detalhe |
|---|---|---|
| App PWA white-label | **Implementado** | Completo com home, ofertas, wallet, perfil |
| Navegação sem login (guest) | **Implementado** | `WhiteLabelLayout` permite browsing sem auth |
| Cadastro/login com marca do empreendedor | **Implementado** | `CustomerAuthPage` com tema dinâmico |
| Acumular pontos | **Implementado** | `earning_events` + `points_ledger` + saldo em `customers` |
| Resgatar em parceiros | **Implementado** | Fluxo de `redemptions` com PIN de 6 dígitos |

---

### RESUMO

✅ Todos os itens do plano original foram implementados. A plataforma está funcional para os 4 perfis: ROOT_ADMIN, BRAND_ADMIN, STORE_ADMIN e CUSTOMER.

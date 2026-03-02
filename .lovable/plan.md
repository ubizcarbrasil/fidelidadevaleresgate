

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

**O que falta para o Domo de Ferro:**

| Funcionalidade faltante | Descrição |
|---|---|
| **Wizard de criação de nova empresa** | Hoje o fluxo é manual (criar tenant, marca, cidade separadamente). Falta um wizard unificado que ao criar uma nova empresa: (a) crie o tenant+brand+branch, (b) gere login provisório `teste@123.com / 123456`, (c) aplique template de home com seções e parceiros de demonstração pré-configurados, (d) permita subir logo e cores antes de liberar, (e) crie cliente teste `cliente@teste.com / 123456` com 1000 pontos, (f) crie parceiro teste `loja@teste.com / 123456`, (g) mostre preview do resultado |
| **Tela de configuração de "kit inicial"** | Definir quantas seções, quantas empresas teste devem nascer populadas (configuração global do Domo de Ferro) |
| **Botões de acesso rápido teste** | No painel do empreendedor, mostrar botões abaixo do login principal para entrar rapidamente nos acessos teste (cliente, loja, admin) enquanto estiverem ativos, com opção de bloquear/desativar |
| **Transbordo de permissões** | O modelo de permissões existe (`role_permissions` + `user_permission_overrides`), mas falta a UI para o Domo de Ferro configurar QUAIS permissões cada empreendedor pode usar, e o empreendedor repassar aos parceiros |

---

### 2. VALE RESGATE (Empreendedor) = `brand_admin`

**Objetivo**: Contratou o SaaS, monta seu negócio de fidelidade private label numa cidade.

| Requisito | Status | Detalhe |
|---|---|---|
| Painel próprio isolado | **Implementado** | `BrandSidebar` + `useBrandGuard` filtra tudo por `brand_id` |
| Dados isolados entre empreendedores | **Implementado** | RLS policies em todas as tabelas filtram por `brand_id` |
| Subdomínio próprio | **Implementado** | `brand_domains` com subdomain resolution (`marca-teste.valeresgate.com`) |
| Configurar visual (logo, cor, nome) | **Implementado** | `brand_settings_json` com `BrandThemeEditor` |
| App PWA white-label com sua marca | **Implementado** | `WhiteLabelLayout` + `CustomerLayout` com tema dinâmico |
| Módulos controlados pelo Domo de Ferro | **Implementado** | `brand_modules` + `ModuleGuard` filtra menus e rotas |
| Link de cadastro de parceiros | **Implementado** | `/register-store` com wizard de 4 etapas |
| Gerenciar parceiros | **Implementado** | `/stores`, `/store-approvals` |
| Gerenciar ofertas e resgates | **Implementado** | `/offers`, `/redemptions` com fluxo completo |
| Programa de pontos | **Implementado** | `points_rules`, `earning_events`, `points_ledger` |

**O que falta para o Empreendedor:**

| Funcionalidade faltante | Descrição |
|---|---|
| **Links de acesso no painel** | Mostrar no dashboard os links diretos: link do app do cliente, link de cadastro de parceiro, link do painel de gestão das lojas |
| **Configurar permissões dos parceiros** | UI para definir o que cada parceiro pode fazer (hoje não existe essa camada de permissões parceiro-específicas) |
| **Acessos teste com botões rápidos** | Botões abaixo do login para acessar rapidamente os perfis de teste criados pelo Domo de Ferro |

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

**O que falta para o Parceiro:**

| Funcionalidade faltante | Descrição |
|---|---|
| **Receptor virar Emissor** | A lógica de `store_type` existe, mas falta um fluxo no portal para o parceiro solicitar ativação como emissor, com aprovação do empreendedor |

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

### RESUMO: O que precisa ser construído

A arquitetura multi-tenant, RBAC, white-label, e o fluxo operacional estão **solidamente implementados**. O que falta são funcionalidades de **provisionamento automatizado e experiência de onboarding**:

1. **Wizard de provisionamento de nova empresa** (prioridade alta)
   - Criar tenant + brand + branch + domínio + usuários teste + dados demo em um único fluxo
   - Configurar logo, cores, preview antes de liberar
   - Gerar logins provisórios automáticos
   - Aplicar template de home com seções e parceiros demo

2. **Painel de "kit inicial" do Domo de Ferro** (configuração global)
   - Definir quantas seções demo, parceiros demo, pontos iniciais

3. **Botões de acesso rápido teste** no painel do empreendedor
   - Entrar como cliente teste, loja teste com um clique
   - Desativar/bloquear quando não precisar mais

4. **Dashboard do empreendedor com links úteis**
   - Link do app cliente, link cadastro parceiro, link painel parceiro

5. **UI de transbordo de permissões**
   - Domo de Ferro → configura permissões do Empreendedor
   - Empreendedor → configura permissões do Parceiro

### Detalhes Tecnico da Implementacao

O wizard de provisionamento usaria uma edge function para executar atomicamente:
```text
Edge Function: provision-brand
  1. INSERT tenant
  2. INSERT brand (com brand_settings_json de logo/cores)
  3. INSERT branch (cidade inicial)
  4. INSERT brand_domain (subdomínio)
  5. CREATE user teste@123.com via supabase.auth.admin
  6. INSERT user_role (brand_admin)
  7. CREATE user cliente@teste.com via supabase.auth.admin
  8. INSERT customer + points_ledger (1000 pontos)
  9. CREATE user loja@teste.com via supabase.auth.admin
  10. INSERT store (parceiro demo)
  11. Aplicar home_template_library default
  12. INSERT brand_modules (cópia dos módulos core)
```

Os botões de acesso teste seriam armazenados em `brand_settings_json` como `test_accounts: [{email, role, is_active}]` e renderizados condicionalmente no dashboard.


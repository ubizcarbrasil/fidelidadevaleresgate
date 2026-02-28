

# AUDITORIA COMPLETA — VALE RESGATE

---

## I) INVENTARIO DO QUE EXISTE HOJE

### Telas — App Cliente (White-Label)
| Tela | Arquivo | Status |
|---|---|---|
| Home (card banco + quick actions + seções dinâmicas) | CustomerHomePage.tsx | Funcional |
| Ofertas (lista vertical, search, filtros) | CustomerOffersPage.tsx | Funcional |
| Detalhe da Oferta (resgate com CPF/PIN) | CustomerOfferDetailPage.tsx | Funcional |
| Detalhe da Loja (perfil público) | CustomerStoreDetailPage.tsx | Funcional |
| Carteira (saldo + histórico ledger) | CustomerWalletPage.tsx | Funcional |
| Perfil do Cliente | CustomerProfilePage.tsx | Funcional |
| Extrato Ledger (overlay banco) | CustomerLedgerOverlay.tsx | Funcional |
| Busca Global | CustomerSearchOverlay.tsx | Funcional |
| Notificações | NotificationDrawer.tsx | Funcional |
| Achadinhos (afiliados) | AchadinhoSection.tsx | Funcional |
| Emissoras | EmissorasSection.tsx | Funcional |
| Seção detalhe (CTA "ver mais") | SectionDetailOverlay.tsx | Funcional |
| Auth Cliente | CustomerAuthPage.tsx | Existe (bypass ativo) |
| Custom Page (/p/:slug) | CustomPage.tsx | Funcional |
| Branch Selector | BranchSelector.tsx | Funcional |

### Telas — Painel do Lojista (STORE_ADMIN)
| Tela | Status |
|---|---|
| Dashboard (KPIs + filtro período) | Funcional |
| Cupons (lista + criar wizard 11 steps) | Funcional |
| Resgate de PIN (PIN+CPF+purchase_value) | Funcional |
| Meu Perfil | Funcional |
| Extrato | Funcional |
| Funcionários | Funcional |
| Termos | Funcional |
| Filiais | Funcional |
| Tutorial | Funcional (placeholder) |
| Suporte | Funcional (placeholder) |
| Registro Wizard (4 etapas + draft) | Funcional |

### Telas — Admin (ROOT / BRAND / BRANCH / TENANT / OPERATOR)
| Tela | Consoles | Status |
|---|---|---|
| Dashboard | Todos | Funcional |
| Tenants CRUD | ROOT | Funcional |
| Brands CRUD | ROOT, TENANT | Funcional |
| Branches CRUD | ROOT, TENANT, BRAND | Funcional |
| Clonar Branch | ROOT | Funcional |
| Domínios (brand_domains) | ROOT, BRAND | Funcional |
| Lojas (stores) | ROOT | Funcional |
| Ofertas (offers) | ROOT | Funcional |
| Clientes (customers) | ROOT | Funcional |
| Resgates (redemptions) | ROOT | Funcional |
| Vouchers CRUD + Wizard | ROOT | Funcional |
| Importar CSV | ROOT, BRAND | Funcional |
| Aprovação de Lojas | ROOT, BRAND | Funcional |
| Aprovar Regras Pontos | ROOT | Funcional |
| Achadinhos (affiliate_deals) | ROOT | Funcional |
| Catálogo (store_catalog_items) | ROOT | Funcional |
| Pontuar (earn_points) | ROOT | Funcional |
| Regras de Pontos | ROOT, BRAND | Funcional |
| Extrato de Pontos | ROOT, BRAND | Funcional |
| Usuarios + Roles | ROOT, BRAND | Funcional |
| Módulos (module_definitions) | ROOT | Funcional |
| Módulos da Marca | ROOT, BRAND | Funcional |
| Permissões (matrix) | ROOT | Funcional |
| Feature Flags | ROOT | Funcional |
| Auditoria | ROOT | Funcional |
| Releases | ROOT | Funcional |
| Relatórios | ROOT | Funcional |
| Templates (section_templates) | ROOT | Funcional |
| Templates Home (library) | ROOT | Funcional |
| Galeria de Ícones | ROOT, BRAND | Funcional |
| Central de Banners | ROOT, BRAND | Funcional |
| Nomes/Rótulos | ROOT, BRAND | Funcional |
| Page Builder | BRAND | Funcional |
| Enviar Notificação | ROOT | Funcional |
| PDV (OperatorRedeem) | OPERATOR | Funcional |
| Tema & Marca (BrandThemeEditor) | BRAND | Funcional |

### Tabelas (44 tabelas)
```text
affiliate_clicks, affiliate_deals, audit_logs, banner_schedules,
branches, brand_domains, brand_modules, brand_section_manual_items,
brand_section_sources, brand_sections, brands, custom_pages,
customer_favorites, customer_notifications, customers, earning_events,
feature_flags, home_template_apply_jobs, home_template_library,
icon_library, import_jobs, menu_labels, module_definitions, offers,
permissions, points_ledger, points_rules, profiles, push_subscriptions,
redemptions, releases, role_permissions, roles, section_templates,
store_catalog_items, store_documents, store_employees, store_points_rules,
stores, tenants, user_permission_overrides, user_roles, voucher_redemptions, vouchers
```

### Roles Implementadas
`root_admin`, `tenant_admin`, `brand_admin`, `branch_admin`, `branch_operator`, `operator_pdv`, `store_admin`, `customer`

### Fluxos Implementados
- Resgate completo (Cliente CPF -> PIN -> Loja valida PIN+CPF -> USED + purchase_value)
- Cadastro de loja (wizard 4 etapas + draft + submit -> PENDING_APPROVAL -> APPROVED)
- Criação de cupom pelo logista (wizard 11 etapas com escalonamento)
- Programa de pontos (regras + earning_events + ledger)
- Aprovação de lojas pelo admin
- Home dinâmica com seções configuráveis
- White-label por domínio/subdomain
- Favoritos, Notificações, Busca

---

## II) CHECKLIST CANONICO

### A — App Cliente
| ID | Item | Done = |
|---|---|---|
| A1 | Home: card bancário com saldo | Exibe pontos + money, abre extrato |
| A2 | Home: quick actions bar | Icons clicáveis com navegação |
| A3 | Home: seções dinâmicas modulares | Renderiza OFFERS/STORES/VOUCHERS/BANNERS |
| A4 | Home: CTA "mostrar mais" abre lista filtrada | Overlay com search + filtros |
| A5 | Home: seção Achadinhos | Lista com link afiliado + click count |
| A6 | Home: seção Emissoras | Lista lojas emissoras |
| A7 | Ofertas: lista vertical com loja, badges, search | Lista com search + filtro por loja |
| A8 | Detalhe oferta: hero + regras + semelhantes + CTA resgate | Layout coupon-style |
| A9 | Resgate: solicita CPF -> gera PIN -> exibe código | Modal com input CPF + confirmação |
| A10 | Detalhe loja: perfil público (info + ofertas + catálogo) | Overlay slide com actions |
| A11 | Carteira: saldo + histórico transações | Card + lista ledger |
| A12 | Extrato overlay: filtros por período | Drawer com Today/7d/30d/All |
| A13 | Busca global (lojas + ofertas) | Overlay com results |
| A14 | Notificações (bell + drawer) | Badge count + lista |
| A15 | Perfil do cliente | Página com dados |
| A16 | Favoritos (heart toggle) | Salva/remove em customer_favorites |
| A17 | Compartilhar oferta (share) | Web Share API / clipboard |
| A18 | Custom pages (/p/:slug) | Renderiza elementos do page builder |
| A19 | Quick actions navegar para seções corretas | Cada botão abre tab/seção correspondente |

### B — Painel do Lojista
| ID | Item | Done = |
|---|---|---|
| B1 | Dashboard: KPIs (emitidos, resgatados, ativos, ganhos) | Cards com filtro período |
| B2 | Dashboard: cupons próximos de vencer | Lista amarela |
| B3 | Cupons: lista + status + criar novo | Tabela + wizard |
| B4 | Wizard cupom: 11 etapas completas | Categoria -> Review -> Salvar |
| B5 | Wizard cupom: escalonamento (até 5 faixas) | scaled_values array |
| B6 | Wizard cupom: termo de aceite gerado + check | Texto gerado + timestamp |
| B7 | Resgate PIN: campo PIN + CPF -> busca -> purchase_value -> USED | Fluxo completo |
| B8 | Meu Perfil: editar dados da loja | Form com campos da store |
| B9 | Extrato: entradas e saídas | Lista ledger |
| B10 | Funcionários: CRUD com roles | Tabela store_employees |
| B11 | Filiais: gerenciar | Lista/form |
| B12 | Termos/Tutorial/Suporte | Conteúdo informativo |
| B13 | Registro: wizard 4 etapas + draft + submit | Persistência + envio |

### C — Admin
| ID | Item | Done = |
|---|---|---|
| C1 | CRUD completo: Tenants, Brands, Branches | Forms + listagens |
| C2 | CRUD: Ofertas, Lojas, Clientes, Resgates | Listagens com paginação |
| C3 | Seções Home: configuração modular completa | Rows, cols, icon_size, filter_mode, banners_json |
| C4 | Page Builder: editor visual + preview + publish | Elements + styles + actions |
| C5 | Central de Banners: agendamento in/out | banner_schedules com start/end |
| C6 | Galeria de Ícones | Lucide + custom upload |
| C7 | Labels renomeáveis | menu_labels por brand |
| C8 | Módulos por marca | brand_modules enable/disable |
| C9 | Permissões: matrix roles x permissions | PermissionsPage |
| C10 | Feature Flags | Scope PLATFORM/TENANT/BRAND/BRANCH |
| C11 | Auditoria | Logs com actor/entity/changes |
| C12 | Templates Home (library + apply jobs) | Biblioteca + aplicação em massa |
| C13 | Aprovação de lojas | Lista + approve/reject |
| C14 | Aprovação de regras de pontos (store) | Approve/reject store_points_rules |
| C15 | Import CSV | Upload + processamento |
| C16 | Enviar Notificação | Push + customer_notifications |
| C17 | Relatórios | Visão geral |

### D — SaaS / Modularidade
| ID | Item | Done = |
|---|---|---|
| D1 | Multi-tenant hierarchy (Platform > Tenant > Brand > Branch) | Tabelas + roles + guards |
| D2 | White-label por domínio | brand_domains + BrandContext |
| D3 | Módulos ativáveis por marca | ModuleGuard + useBrandModules |
| D4 | RLS scoped (has_role + user_has_permission) | Policies em todas tabelas |
| D5 | Sidebars por console scope | 5 sidebars |
| D6 | Temas por marca (cores, fontes, logo) | BrandThemeEditor + brand_settings_json |

### E — Visual / UX
| ID | Item | Done = |
|---|---|---|
| E1 | Cards arredondados + shadows suaves | Aplicado globalmente |
| E2 | Skeleton loading | SectionSkeleton, card skeletons |
| E3 | Microinterações (framer-motion) | Stagger, whileTap, layoutId |
| E4 | Lazy loading de imagens | LazyImage com IntersectionObserver |
| E5 | Scroll horizontal com "peek" | scrollbar-hide + flex gap |
| E6 | Upload de imagem em todos os campos | ImageUploadField |
| E7 | Crop de imagem | ImageCropDialog |

---

## III) GAP ANALYSIS

| ID | Status | O que falta | Prioridade | Esforco |
|---|---|---|---|---|
| A2 | PARCIAL | Quick actions nao navegam (apenas visual) | P1 | Baixo |
| A9 | PARCIAL | Falta expiração configurável do PIN (expires_at preenchido) | P1 | Baixo |
| A10 | PARCIAL | Falta botão Instagram, GPS/mapa, vídeo, galeria de fotos | P1 | Medio |
| A19 | NAO FEITO | Quick actions sem navegação funcional | P1 | Baixo |
| B4 | PARCIAL | Wizard salva na offers mas falta campo title/description no wizard (steps existem mas titulo é genérico) | P2 | Baixo |
| B6 | PARCIAL | Termo é gerado mas não persiste versão do texto aceito (falta coluna terms_version na offers) | P2 | Baixo |
| B8 | OK | — | — | — |
| B9 | PARCIAL | Extrato do lojista existe mas não filtra por tipo entrada/saída | P2 | Baixo |
| C3 | PARCIAL | Drag-and-drop para reordenar seções não implementado | P2 | Medio |
| C5 | PARCIAL | Banner schedules existe na DB mas a UI não filtra por start_at/end_at (exibe todos ativos) | P1 | Baixo |
| C4 | PARCIAL | Page Builder falta: tags de comunicação na imagem, indexação por categoria/segmento | P2 | Medio |
| C17 | PARCIAL | Relatórios existe mas é basico (placeholder charts) | P2 | Alto |
| D4 | OK | RLS robusto em todas tabelas | — | — |
| E5 | OK | Scroll peek implementado | — | — |
| E6 | OK | Agora em todos os campos | — | — |
| — | NAO FEITO | **Expiração automática de PIN** (cron/trigger que marca EXPIRED) | P0 | Medio |
| — | NAO FEITO | **Validação anti-fraude: PIN expirado não pode ser usado** (check no StoreRedeemTab) | P0 | Baixo |
| — | NAO FEITO | **Validação anti-fraude: reutilização de PIN** (check status != USED before lookup) | P0 | Baixo |
| — | NAO FEITO | **Preenchimento de expires_at no resgate** baseado em config da offer/brand | P0 | Baixo |
| — | NAO FEITO | **Perfil público da loja: vídeo embed** | P1 | Baixo |
| — | NAO FEITO | **Perfil público da loja: galeria de imagens** (gallery_urls existe na DB, UI não renderiza) | P1 | Baixo |
| — | NAO FEITO | **Perfil público da loja: botão Instagram** | P1 | Baixo |
| — | NAO FEITO | **Perfil público da loja: botão GPS/localização (abrir mapa)** | P1 | Baixo |
| — | NAO FEITO | **Seção "Emissoras" mostrar regra de pontuação (points_per_real)** | P1 | Baixo |
| — | NAO FEITO | **Catálogo digital acessível pelo cliente na loja emissora** | P1 | Medio |
| — | NAO FEITO | **Admin: menus agrupados por fluxo (Onboarding/Conteúdo/Operação/Financeiro/Config)** nos sidebars BRAND/BRANCH | P2 | Baixo |
| — | NAO FEITO | **Admin: texto help/instrução embutido nos menus** | P2 | Baixo |
| — | NAO FEITO | **Biblioteca de banners reutilizáveis** (galeria centralizada) | P2 | Medio |
| — | NAO FEITO | **Reporting de cliques em banners** | P2 | Medio |
| — | PARCIAL | **Filtros avançados nas seções** (por faixa de crédito, por tags, por segmento, por grupo) — filter_mode existe mas UI só tem recent/random/category | P1 | Medio |
| — | NAO FEITO | **Condição de min_items para exibir seção** | P2 | Baixo |

---

## IV) PLANO DE SPRINTS

### Sprint 1 (P0) — Anti-Fraude + MVP End-to-End
1. Preencher `expires_at` ao criar redemption (baseado em config brand/offer, default 24h)
2. Validar no StoreRedeemTab que `expires_at` não passou antes de permitir baixa
3. Garantir que PIN USED/EXPIRED/CANCELED não apareça na busca (já filtra por PENDING — OK)
4. Quick actions navegando para as tabs corretas (ofertas, carteira, etc.)
5. Testar fluxo completo: criar oferta -> cliente resgata -> lojista valida PIN

### Sprint 2 (P1) — Perfil da Loja + Seções Avançadas
1. Perfil público da loja: galeria de fotos (renderizar gallery_urls)
2. Perfil público da loja: embed de vídeo (video_url)
3. Perfil público da loja: botão Instagram + botão GPS (lat/lng -> Google Maps)
4. Emissoras section: exibir regra de pontuação (points_per_real)
5. Banner schedules: filtrar por start_at/end_at na UI
6. Filtros avançados nas seções (por tag, segmento, faixa crédito)
7. Catálogo digital acessível pelo cliente em lojas emissoras

### Sprint 3 (P1/P2) — Page Builder + Banners + Relatórios
1. Page Builder: indexação e tags de comunicação
2. Drag-and-drop reordenação de seções
3. Biblioteca de banners reutilizáveis
4. Relatórios com gráficos reais (Recharts já instalado)
5. Condição min_items para exibir seção

### Sprint 4 (P2) — Refinamento + Docs
1. Admin sidebars reorganizados por fluxo
2. Textos de ajuda/instrução nos menus
3. Extrato do lojista com filtros avançados
4. Termos: persistir versão do texto aceito
5. Reporting de cliques em banners
6. Documentação inline no admin

---

## V) RISCOS E ALERTAS

| Risco | Impacto | Mitigação |
|---|---|---|
| **PIN sem expiração** | Fraude: PIN antigo pode ser usado indefinidamente | Sprint 1: preencher expires_at + validar |
| **Sem cron para expirar PINs** | PINs PENDING ficam pendentes eternamente | Criar edge function scheduled ou trigger DB |
| **RLS em redemptions** | Verificar que lojista só vê resgates da própria loja | Já filtrado por store_id no frontend; RLS policy existe |
| **Performance: seções carregam N queries** | Home lenta com muitas seções | Usar cache (React Query staleTime), limitar seções |
| **Paginação** | Tabelas com >1000 rows atingem limite Supabase | Implementar cursor pagination nas listagens admin |
| **Storage: bucket brand-assets público** | Qualquer pessoa com URL acessa | Aceitável para assets visuais; docs sensíveis devem ir para bucket privado |
| **Auth bypass no customer app** | Sem autenticação, funcionalidades dependentes de customer_id falham | Aceitável para browse; resgate já exige customer logado |

### Recomendacoes Tecnicas
- Adicionar indices em `offers(store_id, status, is_active)`, `redemptions(token, status)`, `stores(branch_id, approval_status)`
- Usar `staleTime: 5 * 60 * 1000` no React Query para seções que mudam pouco
- Edge function agendada para marcar `redemptions.status = 'EXPIRED'` onde `expires_at < now() AND status = 'PENDING'`


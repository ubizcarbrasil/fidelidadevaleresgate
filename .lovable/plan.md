Plano: Template de Permissões Padrão + Auditoria de Rotas

### Parte 1: Template de Módulos Padrão baseado na UBIZ Resgata

**Problema**: A Edge Function `provision-brand` usa `BASIC_PLAN_ENABLED_KEYS` com apenas 12 módulos básicos. A UBIZ Resgata tem 24 módulos habilitados que representam o conjunto ideal para novas marcas.

**UBIZ Resgata tem habilitados** (24 módulos):
`affiliate_deals`, `api_keys`, `approvals`, `banners`, `brand_theme`, `categories`, `coupons`, `crm`, `custom_pages`, `customers`, `home_sections`, `machine_integration`, `offers`, `page_builder`, `partner_landing`, `profile_links`, `redemption_qr`, `reports`, `stores`, `taxonomy`, `theme_images`, `theme_texts`, `users_management`, `wallet`

**Provisioning atual** (`BASIC_PLAN_ENABLED_KEYS` — 12 módulos):
`theme_colors`, `theme_images`, `theme_texts`, `stores`, `offers`, `redemption_qr`, `wallet`, `customers`, `home_sections`, `brand_theme`, `branches`, `guide_brand`, `points`, `points_rules`

**Solução**: Atualizar `BASIC_PLAN_ENABLED_KEYS` na Edge Function `provision-brand` para refletir os 24 módulos da UBIZ Resgata como padrão para novas marcas.

**Arquivo**: `supabase/functions/provision-brand/index.ts` (linhas 593-598)

---

### Parte 2: Auditoria de Rotas — Problemas Identificados

Após revisão completa de todas as rotas (Root, Brand, Branch, Operator, Store, Customer), segue o diagnóstico:

#### Rotas OK (sem problemas)

- **Auth** (`/auth`, `/reset-password`): Corretas, públicas
- **Customer white-label**: Layout SPA com tabs, lazy-loading correto
- **Store Panel** (`/store-panel`): Module-guard via `useBrandModules`, tabs filtradas
- **Root console**: Sidebar completa, sem module guards (correto para root)
- **Brand console**: Module guards aplicados corretamente em todas as rotas relevantes
- **Landing pages** (`/landing`, `/:slug/parceiro`): Públicas, roteamento com prioridade

#### Problemas Encontrados


| #   | Severidade | Rota / Componente               | Problema                                                                                                                                              |
| --- | ---------- | ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Media      | `/ganha-ganha-store-summary`    | Rota definida no `RootSidebar` mas sem correspondente no `App.tsx` — resulta em 404                                                                   |
| 2   | Baixa      | `/send-notification`            | Rota no `App.tsx` sem `ModuleGuard` mas aparece no `RootSidebar` sem `moduleKey` — acessível por qualquer admin autenticado                           |
| 3   | Baixa      | `BrandSidebar` vs `RootSidebar` | Root sidebar não usa `moduleKey` filtering (correto), mas items como `achadinhos`, `categorias_achadinhos` aparecem duplicados em ambos sem distinção |
| 4   | Baixa      | `StoreOwnerPanel`               | O `useEffect` de fetch da store não inclui `roles` nas deps do effect (linha 111), podendo causar stale data em troca de role                         |
| 5   | Info       | Lazy loading                    | Todas as 80+ páginas usam `lazy()` corretamente — bom para performance                                                                                |
| 6   | Info       | Realtime no Dashboard           | Subscreve 4 tabelas via `postgres_changes` — adequado, mas sem cleanup de channel se brandId mudar                                                    |


#### Plano de Melhoria

1. **Adicionar rota `/ganha-ganha-store-summary**` no `App.tsx` com `ModuleGuard moduleKey="ganha_ganha"` (corrigir 404)
2. **Adicionar `ModuleGuard**` à rota `/send-notification` com `moduleKey="notifications"`
3. **Adicionar `roles` à dependency array** do useEffect no `StoreOwnerPanel` (linha 111)
4. **Atualizar `BASIC_PLAN_ENABLED_KEYS**` na Edge Function para espelhar UBIZ Resgata

### Arquivos a editar

- `supabase/functions/provision-brand/index.ts` — atualizar módulos padrão
- `src/App.tsx` — adicionar rota faltante + ModuleGuard
- `src/pages/StoreOwnerPanel.tsx` — corrigir dependency array

### Restrição

Apenas ajustes de configuração e correções pontuais. Nenhuma alteração de lógica de negócio, autenticação ou estrutura de banco.
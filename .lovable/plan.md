

## Auditoria de Rotas — Problemas Encontrados

Cruzei todas as rotas do `App.tsx` com os menus do `BrandSidebar`, `RootSidebar`, `BranchSidebar`, `TenantSidebar` e `OperatorSidebar`. Encontrei **16 inconsistências** organizadas em 3 categorias:

---

### A. Rotas com RootGuard que Brand Admin precisa acessar (4 itens)

Estas rotas estão bloqueadas para o Empreendedor mas aparecem no menu dele:

| Rota | Guard atual | Deveria ser |
|------|-----------|-------------|
| `/icon-library` | `RootGuard` | `ModuleGuard "icon_library"` |
| `/offer-card-config` | `RootGuard` | `ModuleGuard "offer_card_config"` |
| `/sponsored-placements` | `RootGuard` | `ModuleGuard "sponsored"` |
| `/brand-permissions` | `RootGuard` | `ModuleGuard "store_permissions"` |

---

### B. Rotas sem nenhum guard (precisam de ModuleGuard) (8 itens)

| Rota | ModuleKey esperado (do sidebar) |
|------|-------------------------------|
| `/banner-manager` | `banners` |
| `/page-builder-v2` | `page_builder` |
| `/pdv` | `earn_points_store` |
| `/audit` | `audit` |
| `/emitter-requests` | `multi_emitter` |
| `/partner-landing-config` | `partner_landing` |
| `/access-hub` | `access_hub` |
| `/api-docs` | `api_keys` |

---

### C. ModuleKey divergente entre sidebar e rota (2 itens)

| Rota | Guard na rota | ModuleKey no BrandSidebar |
|------|--------------|--------------------------|
| `/approve-store-rules` | `earn_points_store` | `multi_emitter` |
| `/csv-import` | `stores` | `csv_import` |

---

### D. Rotas sem guard mas aceitáveis (sem mudança)

- `/home-templates`, `/clone-branch`, `/brand-modules`, `/brand-journey`, `/emitter-journey`, `/driver-config`, `/subscription`, `/users`, `/permissions` — são rotas genéricas ou always-on, sem moduleKey no sidebar, acesso controlado pelo `useBrandGuard` no escopo.

---

### Alterações no `src/App.tsx`

Todas as mudanças são trocar o wrapper da `<Route>`:

```text
Linha 175: audit         → ModuleGuard "audit"
Linha 181: pdv           → ModuleGuard "earn_points_store"
Linha 186: approve-rules → ModuleGuard "multi_emitter"
Linha 178: csv-import    → ModuleGuard "csv_import"
Linha 195: icon-library  → ModuleGuard "icon_library"
Linha 196: banner-manager → ModuleGuard "banners"
Linha 198: page-builder   → ModuleGuard "page_builder"  (manter sem guard, é legacy)
Linha 199: page-builder-v2 → ModuleGuard "page_builder"
Linha 203: brand-permissions → ModuleGuard "store_permissions"
Linha 206: emitter-requests → ModuleGuard "multi_emitter"
Linha 221: api-docs       → ModuleGuard "api_keys"
Linha 223: partner-landing-config → ModuleGuard "partner_landing"
Linha 224: access-hub     → ModuleGuard "access_hub"
Linha 226: sponsored-placements → ModuleGuard "sponsored"
Linha 229: offer-card-config → ModuleGuard "offer_card_config"
```

**15 linhas alteradas, 1 arquivo (`src/App.tsx`)**. Nenhuma mudança em sidebars ou outros componentes.


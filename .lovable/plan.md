

## Governança de Ofertas Espelhadas — Achadinhos

### Contexto atual

A tabela `affiliate_deals` já possui campos `origin`, `origin_external_id`, `origin_url`, `sync_status`, `sync_error`, `raw_payload`, `first_imported_at`, `last_synced_at`. A página `MirrorSyncPage` já separa fontes por um seletor. Logs existem em `mirror_sync_logs` e config em `mirror_sync_config`.

O que **falta**: tabela de denúncias, tabela de grupos de sync, status padronizados, botão de report na vitrine, módulo admin de governança com grupos, limpeza em massa, e sincronização inteligente com detecção de remoção.

---

### Fase 1 — Banco de dados (3 migrations)

**Migration 1: Novos campos em `affiliate_deals`**
- `source_group_id TEXT` — ID do grupo na origem
- `source_group_name TEXT` — nome do grupo
- `marketplace TEXT` — marketplace de onde veio (ex: mercadolivre, amazon)
- `current_status TEXT DEFAULT 'active'` — enum: active, suspected_outdated, user_reported, removed_from_source, sync_error, archived, inactive

**Migration 2: Tabela `offer_reports`**
```sql
CREATE TABLE offer_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id UUID NOT NULL REFERENCES affiliate_deals(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reason TEXT NOT NULL,
  note TEXT,
  screenshot_url TEXT,
  status TEXT DEFAULT 'pending', -- pending, reviewed, confirmed, dismissed
  created_at TIMESTAMPTZ DEFAULT now()
);
```
Com RLS: qualquer autenticado pode INSERT, root/brand admin pode SELECT/UPDATE.

**Migration 3: Tabela `offer_sync_groups`**
```sql
CREATE TABLE offer_sync_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  source_system TEXT NOT NULL, -- dvlinks, divulgador_inteligente
  source_group_id TEXT NOT NULL,
  source_group_name TEXT,
  last_sync_at TIMESTAMPTZ,
  last_sync_status TEXT DEFAULT 'pending',
  total_imported INT DEFAULT 0,
  total_active INT DEFAULT 0,
  total_removed INT DEFAULT 0,
  total_reported INT DEFAULT 0,
  sync_version INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(brand_id, source_system, source_group_id)
);
```
Com RLS para brand/root admins.

---

### Fase 2 — Botão "Preço diferente? Avisar" na vitrine

**Arquivo**: `src/components/customer/AchadinhoDealDetail.tsx`

- Adicionar botão abaixo do CTA "Ir para oferta"
- Ao clicar, abrir dialog `ReportarOfertaDialog` com:
  - Select de motivo (preço diferente, oferta indisponível, link com erro, produto diferente, outro)
  - Textarea opcional para observação
  - Upload opcional de screenshot (bucket `brand-assets`)
  - Botão enviar → `INSERT INTO offer_reports`
  - Toast de confirmação

**Novo componente**: `src/components/customer/ReportarOfertaDialog.tsx`

---

### Fase 3 — Módulo administrativo de governança

**Nova página**: `src/pages/OfferGovernancePage.tsx`  
**Nova rota**: `/offer-governance` (protegida por ModuleGuard `affiliate_deals`)

**Layout**:
- Tabs primárias: **Divulga Link** | **Divulgador Inteligente**
- Cada tab mostra:
  - KPIs: total grupos, total ofertas, ativas, removidas, denunciadas, última sync
  - Sub-tabs: **Grupos** | **Ofertas** | **Denúncias** | **Limpeza** | **Logs**

**Novos componentes** (todos em `src/components/offer-governance/`):
1. `GovernanceKpis.tsx` — cards de métricas por origem
2. `GovernanceGroupsTable.tsx` — lista de grupos com ações (sync, reset, arquivar, reimportar, limpar erros/removidas/denunciadas)
3. `GovernanceDealsTable.tsx` — tabela de ofertas com filtros (origem, grupo, marketplace, status, período) e ações em massa (desativar, arquivar, resetar grupo, remover espelhamento, forçar sync)
4. `GovernanceReportsTable.tsx` — tabela de denúncias com ações (revisar, confirmar, dispensar, ocultar oferta)
5. `GovernanceCleanup.tsx` — painel de limpeza em massa com filtros compostos e ações bulk
6. `GovernanceSyncLogs.tsx` — logs de sync filtrados por origem

**API layer**: `src/lib/api/offerGovernance.ts` — todas as queries e mutations para o módulo

---

### Fase 4 — Sincronização inteligente (Edge Function)

**Arquivo**: `supabase/functions/mirror-sync/index.ts`

Evoluir a lógica existente para:
1. Ao sincronizar, criar/atualizar registro em `offer_sync_groups`
2. Comparar ofertas da origem por `origin + origin_external_id`
3. Ofertas novas → `INSERT` com `current_status = 'active'`
4. Ofertas existentes → `UPDATE` dados (preço, imagem, título)
5. Ofertas que sumiram da origem → `current_status = 'removed_from_source'`, `is_active = false`, `visible_driver = false`
6. Ofertas arquivadas que reapareceram → reativar com `current_status = 'active'`
7. Atualizar contadores em `offer_sync_groups` ao final

**Reset seguro**: não deleta registros, apenas marca como `archived`, mantém logs, incrementa `sync_version` no grupo.

---

### Fase 5 — Auto-ocultação por denúncias

Lógica no `GovernanceReportsTable`:
- Quando uma oferta atinge N denúncias confirmadas (configurável, default 3), marcar como `suspected_outdated` e `is_active = false`
- Exibir badge de alerta no admin

---

### Fase 6 — Navegação

- Adicionar link "Governança de Ofertas" no `RootSidebar` e `BrandSidebar` (seção Gestão Comercial)
- A página `MirrorSyncPage` existente permanece como painel operacional; a nova `OfferGovernancePage` é o módulo de governança completo

---

### Resumo de arquivos

| Ação | Arquivo |
|------|---------|
| Migration | 3 novas migrations (campos, offer_reports, offer_sync_groups) |
| Nova página | `src/pages/OfferGovernancePage.tsx` |
| Novo API | `src/lib/api/offerGovernance.ts` |
| Novos componentes | 6 em `src/components/offer-governance/` |
| Novo componente customer | `src/components/customer/ReportarOfertaDialog.tsx` |
| Editar | `AchadinhoDealDetail.tsx` (botão report) |
| Editar | `mirror-sync/index.ts` (sync inteligente + grupos) |
| Editar | `RootSidebar.tsx` / `BrandSidebar.tsx` (nav) |
| Editar | `App.tsx` (rota) |

### Escalabilidade

A arquitetura usa `source_system TEXT` em vez de enum, permitindo adicionar novas fontes sem migrations. Todas as queries filtram por `source_system`, garantindo isolamento absoluto entre origens.


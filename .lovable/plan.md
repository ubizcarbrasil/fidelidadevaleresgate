

## O que falta implementar

A maioria do plano foi executada (migrations, tabelas, componentes de UI, botão de report, rota, navegação). Porém **duas fases críticas do plano não foram implementadas**:

---

### 1. Sincronização Inteligente no Edge Function (Fase 4 do plano)

O `mirror-sync/index.ts` **não foi atualizado**. Ele continua com a lógica antiga — sem nenhuma referência a `current_status`, `offer_sync_groups`, ou detecção de remoção.

**O que falta adicionar no edge function:**

- Ao sincronizar, criar/atualizar registro em `offer_sync_groups` (brand_id, source_system, source_group_id, contadores)
- Setar `current_status = 'active'` em ofertas novas e atualizadas
- Detectar ofertas que **sumiram da origem** e marcar como `removed_from_source` + `is_active = false`
- Reativar ofertas arquivadas que reapareceram na origem
- Atualizar contadores (`total_imported`, `total_active`, `total_removed`) em `offer_sync_groups` ao final
- Incrementar `sync_version` no grupo após cada sync

**Arquivo**: `supabase/functions/mirror-sync/index.ts`

---

### 2. Auto-ocultação por denúncias (Fase 5 do plano)

Nenhuma lógica foi implementada para auto-ocultar ofertas com múltiplas denúncias confirmadas.

**O que falta:**
- No `GovernanceReportsTable`, ao confirmar uma denúncia, verificar quantas denúncias confirmadas a oferta já tem
- Se atingir o limiar (default 3), marcar a oferta como `current_status = 'suspected_outdated'` e `is_active = false`
- Exibir badge de alerta no admin para ofertas com denúncias acumuladas

**Arquivos**: `src/components/offer-governance/GovernanceReportsTable.tsx` e `src/lib/api/offerGovernance.ts`

---

### 3. Ações nos Grupos (parcialmente ausente)

O `GovernanceGroupsTable` é somente leitura — exibe dados mas **não tem botões de ação**. O plano previa:
- Sincronizar agora
- Resetar grupo (arquivar ofertas, incrementar sync_version)
- Reimportar grupo
- Limpar ofertas com erro / removidas / denunciadas

**Arquivo**: `src/components/offer-governance/GovernanceGroupsTable.tsx`

---

### Resumo das pendências

| Fase | Status | Ação |
|------|--------|------|
| Fase 1 — Migrations | Feito | — |
| Fase 2 — Botão report | Feito | — |
| Fase 3 — UI admin | Feito | — |
| Fase 4 — Sync inteligente | **Pendente** | Atualizar `mirror-sync/index.ts` |
| Fase 5 — Auto-ocultação | **Pendente** | Lógica no Reports + API |
| Fase 6 — Navegação | Feito | — |
| Ações nos Grupos | **Pendente** | Botões no `GovernanceGroupsTable` |

---

### Plano de implementação

#### Passo 1: Atualizar `mirror-sync/index.ts`
- Após o upsert de cada oferta, setar `current_status = 'active'`
- Após processar todas as ofertas de um grupo, buscar ofertas existentes no DB que **não vieram na sync** e marcar como `removed_from_source`
- Criar/atualizar registro em `offer_sync_groups` com contadores
- Incrementar `sync_version`

#### Passo 2: Adicionar
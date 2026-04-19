# Arquitetura de Modelos de Negócio — Vale Resgate

> Documento canônico da arquitetura introduzida nas Sub-fases 5.1–5.9 (abril/2026).
> Estado atual: **beta restrito a Ubiz Resgata** (`db15bd21-9137-4965-a0fb-540d8e8b26f1`).

---

## 1. Visão geral

### Problema

O modelo antigo controlava a oferta da plataforma por **módulos técnicos** (ex: `achadinhos_motorista`, `cardapio_digital`, `crm_passageiro`). Isso forçava o empreendedor a entender a granularidade técnica do produto e gerou três dores:

1. **Pricing acoplado ao código:** mudar o que vai num plano exigia mexer em `plan_module_templates` referenciando IDs técnicos.
2. **Cidade sem autonomia comercial:** filiais não conseguiam ligar/desligar uma proposta inteira (ex: "ativar Ganha-Ganha aqui") sem mexer em N módulos.
3. **Faturamento opaco:** sem conceito de "modelo Ganha-Ganha" no banco, faturar margem sobre cashback emitido era cálculo client-side, sem auditoria.

### Solução

Introduzir uma camada conceitual acima dos módulos: o **Modelo de Negócio**. Cada modelo é uma proposta comercial coerente (ex: "Cashback Ganha-Ganha", "Marketplace Motorista", "CRM Passageiro Premium") que agrupa N módulos técnicos como dependências.

### Decisões fundamentais

- **Catálogo central de 13 modelos** (`business_models`), curado pelo Raiz.
- **Modelos × Planos:** quais modelos cada plano oferece (substitui parcialmente `plan_module_templates`).
- **Modelos × Brands:** o que o empreendedor ativou (`brand_business_models`).
- **Override por cidade:** filial pode opt-in/opt-out de um modelo (`city_business_model_overrides`).
- **Trigger SQL garante consistência** entre `brand_business_models` e `brand_modules` (Sub-fase 5.7) — liga REQUIRED ao ativar, só desliga REQUIRED se nenhum outro modelo ativo precisar.
- **Pricing Ganha-Ganha versionado por plano** (`plan_ganha_ganha_pricing` com `valid_from`/`valid_to`).
- **Beta gate:** `brand_settings_json.business_models_ui_enabled === true` (memória `architecture/city-flag-resolution-rule`).

---

## 2. Modelo de dados

### Tabelas novas

| Tabela | Papel | RLS |
|---|---|---|
| `business_models` | Catálogo curado (13 modelos: key, name, audience, pricing_model, sort_order) | Leitura pública, escrita root |
| `business_model_modules` | N-N modelo × módulo técnico (com `is_required`) | Leitura autenticada, escrita root |
| `plan_business_models` | Quais modelos cada plano (free/starter/profissional/enterprise) oferece | Leitura autenticada, escrita root |
| `brand_business_models` | O que cada brand ativou + `ganha_ganha_margin_pct` + `config_json` | Leitura por brand, escrita brand_admin |
| `city_business_model_overrides` | Override por cidade (branch) | Leitura por branch, escrita brand_admin/branch_admin |
| `plan_ganha_ganha_pricing` | Histórico de pricing GG por plano (`valid_from`/`valid_to`) | Leitura autenticada, escrita root |

### Tabela legada relacionada (preservada)

- `ganha_ganha_billing_events` — ledger de eventos GG, fonte dos relatórios da Sub-fase 5.8
- `brand_modules` — agora **mantido em sincronia** pelo trigger 5.7 a partir de `brand_business_models`

Ver `DEPRECATION_LOG.md` para `city_module_overrides` e `plan_module_templates` (legados, ainda ativos para brands fora do beta).

---

## 3. RPCs principais

| RPC | Sub-fase | Papel |
|---|---|---|
| `resolve_active_business_models(p_brand_id, p_branch_id?)` | 5.6 | Resolve quais modelos estão ativos efetivamente (brand × override de cidade) |
| `apply_business_model_template(p_brand_id, p_plan_key)` | 5.3 | Aplica template do plano nas ativações da brand |
| `rpc_gg_report_summary` | 5.8 | KPIs do período (pts, fee, n_events) |
| `rpc_gg_report_by_store` | 5.8 | Breakdown por loja parceira |
| `rpc_gg_report_by_branch` | 5.8 | Breakdown por filial |
| `rpc_gg_report_by_month` | 5.8 | Breakdown temporal (12 meses) |

Todas as RPCs de relatório validam role + escopo no início (root_admin OR brand_admin com escopo OR store_admin com escopo) e usam `SECURITY DEFINER` com `search_path=public`.

---

## 4. Hooks-chave

| Hook | Caminho | Papel |
|---|---|---|
| `useBusinessModelsUiEnabled` | `src/compartilhados/hooks/hook_business_models_ui_flag.ts` | Decide se brand vê UI nova (lê `brand_settings_json`) |
| `useResolvedBusinessModels` | `src/features/modelos_negocio/hooks/` | Wrapper sobre `resolve_active_business_models` |
| `useGgReportSummary` / `useGgReportByStore` / etc. | `src/compartilhados/hooks/hook_relatorios_ganha_ganha.ts` | RPCs de relatório (Sub-fase 5.8) |
| `useExportGgCsv` / `useExportGgPdf` | idem | Exports client-side com audit log |

---

## 5. Trigger de sincronização (Sub-fase 5.7)

Função `tg_sync_brand_modules_from_business_models()` + trigger AFTER INSERT/UPDATE/DELETE em `brand_business_models`.

**Regra inteligente:**
- Ativar modelo → liga TODOS os módulos REQUIRED dele em `brand_modules`
- Desativar modelo → só desliga REQUIRED se **nenhum outro modelo ativo da mesma brand** precisar do mesmo módulo

Garante: nunca há divergência entre o que o empreendedor escolheu (modelos) e o que o sistema enxerga em runtime (módulos técnicos).

---

## 6. UI por persona

| Persona | Onde | O que vê |
|---|---|---|
| **Raiz** | `/business-models-catalog`, `/plan-business-models`, `/ganha-ganha-pricing`, `/ganha-ganha-reports` | Catálogo, matriz Modelos×Planos, pricing GG versionado, relatórios consolidados |
| **Empreendedor** | `/brand-modules` (3 abas: Modelos / Modelos por Cidade / Funcionalidades técnicas) | Ativa modelos da própria brand, define margem GG, vê faturamento próprio |
| **Filial (branch_admin)** | `/brand-modules` aba "Modelos por Cidade" (escopo só dela) | Override do que a brand ofertou |
| **Loja parceira (store_admin)** | `/store/ganha-ganha` | Visão de auto-serviço dos próprios eventos GG |

Tela legada `PlanModuleTemplatesPage.tsx` (`/plan-templates`) recebeu **banner de aviso** em 2026-04-19 e continua acessível para brands fora do beta.

---

## 7. Beta gate

Toda UI nova é gateada por:

```ts
const settings = brand.brand_settings_json ?? {};
const enabled = settings["business_models_ui_enabled"] === true;
```

Memória obrigatória: `architecture/city-flag-resolution-rule` — ausente = OFF, jamais truthy fraco.

Para ligar uma brand ao beta:
```sql
UPDATE brands
SET brand_settings_json = brand_settings_json || '{"business_models_ui_enabled":true}'::jsonb
WHERE id = '<brand_id>';
```

Para desligar (rollback global de UI):
```sql
UPDATE brands
SET brand_settings_json = brand_settings_json - 'business_models_ui_enabled'
WHERE id = '<brand_id>';
```

---

## 8. Relatórios e exports (Sub-fase 5.8)

- Hub principal: `/ganha-ganha-reports` (root + brand_admin)
- Auto-serviço da loja: `/store/ganha-ganha`
- Filtros: range arbitrário, loja, cidade (apenas root: marca)
- Breakdowns: por loja, por cidade, por mês
- Exports: **CSV** (client-side, formato achatado p/ contador) + **PDF** (jspdf + autoTable, A4 retrato)
- Auditoria: cada export grava em `audit_logs` (`entity_type='report_export'`, `action='csv_exported'|'pdf_exported'`)

Detalhes em `src/features/relatorios_gg/`.

---

## 9. Convivência com fluxo legado

Ver `DEPRECATION_LOG.md`. Resumo:

- `city_module_overrides` e `plan_module_templates` continuam ativas para brands fora do beta.
- Trigger 5.7 garante que `brand_modules` (consumido em runtime) sempre reflete a verdade — independente do caminho que a brand usou para chegar lá.
- Página `/plan-templates` mantida com banner.
- Página `/brand-permissions` (já tombstone desde 2026-04-18) intocada nesta sub-fase.

---

## 10. Fluxo de rollback global

Cenário: bug grave aparece no beta. Como tirar o ar?

1. **Desligar UI nova para todas brands** (1 comando):
   ```sql
   UPDATE brands
   SET brand_settings_json = brand_settings_json - 'business_models_ui_enabled';
   ```
   → todas brands voltam ao fluxo legado de módulos técnicos. Trigger 5.7 continua rodando, garantindo consistência.

2. **Desligar trigger** (se a regra inteligente estiver causando o problema):
   ```sql
   ALTER TABLE brand_business_models DISABLE TRIGGER trg_sync_brand_modules_from_business_models;
   ```
   → mudanças em `brand_business_models` deixam de propagar. `brand_modules` fica congelado.

3. **Reabilitar:** `ENABLE TRIGGER` + reativar flag por brand.

Tabelas novas e dados em `brand_business_models` permanecem intactos durante rollback.

---

## 11. Permissões e RLS

Todas as tabelas novas seguem o padrão multi-tenant da plataforma:

- **Leitura por brand:** `auth.uid()` em `get_user_brand_ids(auth.uid())` ou role root
- **Escrita brand_admin:** mesmo critério + `has_role(auth.uid(), 'brand_admin')`
- **Escrita root:** `has_role(auth.uid(), 'root_admin')`
- **Catálogo (`business_models`, `business_model_modules`, `plan_business_models`):** leitura aberta autenticada, escrita só root

RPCs `SECURITY DEFINER` validam role explicitamente no início — nunca dependem só do front.

---

## 12. Audit log

Eventos relevantes registrados em `audit_logs`:

| `entity_type` | `action` | Sub-fase |
|---|---|---|
| `business_model_activation` | `activated` / `deactivated` | 5.4 |
| `city_business_model_override` | `set_on` / `set_off` / `removed` | 5.6 |
| `report_export` | `csv_exported` / `pdf_exported` | 5.8 |
| `plan_business_models` | `updated` | 5.3 |

`details_json` carrega filtros, IDs e contagens conforme o caso.

---

## 13. Pendências

- **Fase 4.1b:** travada no deploy de Edge Function (não resolvida por 5.x).
- **Fase 4.3c:** pendente, sem bloqueio para 5.x.
- **Expansão pós-beta:** após 1–2 semanas de produção estável em Ubiz Resgata, expandir flag para 2ª/3ª brand piloto e medir.
- **Integração Stripe / cobrança automática:** fica para fase 6 (5.x entregou apenas relatórios informativos).
- **Relatório de divergências brand_business_models × brand_modules:** considerar tela manual de reconciliação se trigger 5.7 mostrar gaps em produção.
- **Decidir destino final de `city_module_overrides`, `plan_module_templates`, `brand_permission_config`** após beta consolidar.

---

## 14. Histórico de execução

| Sub-fase | Data | Escopo entregue | Arquivos principais |
|---|---|---|---|
| **5.1** | 2026-04-18 | Catálogo `business_models` (13 modelos) + `business_model_modules` (99 vínculos N-N) | migração inicial; `BusinessModelsCatalogPage.tsx` |
| **5.2** | 2026-04-18 | RPC `resolve_active_business_models` + hook `useResolvedBusinessModels` | RPC + `src/features/modelos_negocio/hooks/` |
| **5.3** | 2026-04-18 | `plan_business_models` + UI `/plan-business-models` (Raiz) + RPC `apply_business_model_template` | `PlanBusinessModelsPage.tsx` |
| **5.4** | 2026-04-19 | `brand_business_models` + aba "Modelos" no `/brand-modules` (empreendedor) + audit | `BrandModelsTab.tsx` |
| **5.5** | 2026-04-19 | Hook `useBusinessModelsUiEnabled` (beta gate) + flag em Ubiz Resgata + Pricing GG versionado | `hook_business_models_ui_flag.ts`; `plan_ganha_ganha_pricing` |
| **5.6** | 2026-04-19 | `city_business_model_overrides` + aba "Modelos por Cidade" + rota `/branch-business-models` | `BranchBusinessModelsPage.tsx` |
| **5.7** | 2026-04-19 | Trigger SQL `tg_sync_brand_modules_from_business_models` (núcleo da arquitetura) | função plpgsql + trigger AFTER em `brand_business_models` |
| **5.8** | 2026-04-19 | Relatórios GG (4 RPCs SECURITY DEFINER + UI hub + CSV + PDF) | `GanhaGanhaReportsPage.tsx`, `StoreGanhaGanhaPage.tsx`, `hook_relatorios_ganha_ganha.ts` |
| **5.9** | 2026-04-19 | Depreciação conservadora + documentação (este doc + `DEPRECATION_LOG.md` + banner em `PlanModuleTemplatesPage` + COMMENTs SQL) | `DEPRECATION_LOG.md`, `BUSINESS_MODELS_ARCHITECTURE.md` |

Estado final ao término de 5.9: **arquitetura implementada e estável em beta. Sem regressões para brands fora do beta. Trigger garante consistência entre os dois mundos. Pronto para observação de 1–2 semanas antes de expansão.**

# Log de Depreciações — Vale Resgate

Documento canônico que rastreia todos os ativos (tabelas, rotas, páginas, edges, hooks) que foram **descontinuados conceitualmente** mas que **permanecem fisicamente no projeto** por motivos de segurança, compatibilidade ou rollout gradual.

Regra de ouro: **esconder, não deletar**. Toda depreciação aqui é reversível.

---

## 2026-04-19 — Sub-fase 5.9: Modelos de Negócio em beta

### Status: DEPRECAÇÃO PARCIAL (apenas para brands em beta)

A flag `brand_settings_json.business_models_ui_enabled === true` controla quem usa a nova arquitetura de **Modelos de Negócio** (sub-fases 5.1–5.8).

Hoje em beta:
- **Ubiz Resgata** (`db15bd21-9137-4965-a0fb-540d8e8b26f1`)

Para todas as demais brands o fluxo legado continua sendo a única fonte de verdade.

---

### `city_module_overrides` (tabela)

- **Substituída por:** `city_business_model_overrides` (Sub-fase 5.6)
- **Status:** ativa para fluxo legado, `COMMENT SQL` adicionado em 2026-04-19
- **Ainda consumida por:**
  - `src/compartilhados/hooks/hook_modulos_resolvidos.ts` (Realtime + cascata sidebar)
  - `src/compartilhados/hooks/hook_city_overrides.ts` (Central de Módulos por cidade)
  - `src/compartilhados/hooks/hook_catalogo.ts`
- **Remoção prevista:** após beta validar e expandir para 100% das brands
- **Rollback:** `COMMENT ON TABLE public.city_module_overrides IS NULL;`

---

### `plan_module_templates` (tabela)

- **Substituída por:** `plan_business_models` (Sub-fase 5.3)
- **Status:** ativa para fluxo legado, `COMMENT SQL` adicionado em 2026-04-19
- **Ainda consumida por:**
  - `src/pages/PlanModuleTemplatesPage.tsx` (UI do Raiz, no menu RootSidebar)
  - Edge Function `apply-plan-template`
- **Remoção prevista:** idem `city_module_overrides`
- **Rollback:** `COMMENT ON TABLE public.plan_module_templates IS NULL;`

---

### `/plan-templates` (rota e página `PlanModuleTemplatesPage`)

- **Substituída por:** `/brand-modules` → aba "Modelos de Negócio" → sub-tab "Modelos × Planos" (apenas para brands em beta)
- **Status:** rota e link no `RootSidebar` mantidos. **Banner de aviso adicionado no topo da página** em 2026-04-19.
- **Remoção prevista:** fase 6 (após beta expandir e UI nova substituir 100%)
- **Rollback:** remover bloco `<Alert>` do JSX de `PlanModuleTemplatesPage.tsx`

---

### `/brand-permissions` (rota e `BrandPermissionOverflowPage`)

- **Já estava depreciada desde 2026-04-18** (Caminho B do diagnóstico pré-Modelos de Negócio).
- **Substituída por:** Central de Módulos (`/admin/central-modulos`) — controle real é `brand_modules`.
- **Status:** tela é tombstone informativa com Alert "Esta tela foi descontinuada" + botões para Central de Módulos e voltar. Não lê nem grava em `brand_permission_config`.
- **Tabela `brand_permission_config`:** preservada com dados intactos. Não consumida em runtime.
- **Ainda referenciada por:** `RootSidebar` (menu `sidebar.perm_parceiros`), `BrandJourneyGuidePage.tsx`, `helpContent.ts`, `dados_manuais.ts`.
- **Remoção prevista:** avaliar junto com `city_module_overrides` (fase 6+)
- **Rollback:** nenhum (já é só uma página de aviso, sem alteração em 5.9)

---

### Contexto

Esta depreciação é parte do rollout do projeto **Modelos de Negócio** (Sub-fases 5.1–5.9), documentado em `BUSINESS_MODELS_ARCHITECTURE.md`.

Princípio operacional: enquanto a flag `business_models_ui_enabled` não estiver ligada para 100% das brands, o fluxo legado precisa continuar funcional e intocado. Por isso nenhuma tabela é dropada, nenhum arquivo TS é deletado e o trigger de sincronização da Sub-fase 5.7 garante consistência entre os dois mundos.

---

## Como reverter qualquer item deste log

Cada entrada acima documenta seu próprio rollback. Em geral:

1. **Tabelas com COMMENT:** `COMMENT ON TABLE <tabela> IS NULL;`
2. **Banners em páginas:** remover bloco `<Alert>` adicionado.
3. **Tabelas com dados:** nunca foram tocados — basta voltar a usar o código antigo.
4. **Flag global:** `UPDATE brands SET brand_settings_json = brand_settings_json - 'business_models_ui_enabled' WHERE id = '<brand_id>';` desliga o beta para uma marca.

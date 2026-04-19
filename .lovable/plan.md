

# Sub-fase 5.9 — Depreciação conservadora + documentação

## 1. Investigação de "/permissions-overflow"

**A rota `/permissions-overflow` NÃO existe.** A referência é a `/brand-permissions`, página `BrandPermissionOverflowPage.tsx`.

**O que faz:** Apenas uma tela informativa (já depreciada em 2026-04-18, antes desta sub-fase). Mostra um Alert "Esta tela foi descontinuada" + 2 botões: "Ir para a Central de Módulos" e "Voltar". Não lê nem grava em `brand_permission_config` mais.

**Quem linka:**
- `RootSidebar` via menu "sidebar.perm_parceiros" → `/brand-permissions`
- `BrandJourneyGuidePage.tsx` (guia de onboarding) referencia a rota
- `helpContent.ts` tem entrada de ajuda
- `dados_manuais.ts` referencia em manual

**Relação com Modelos de Negócio:** Indireta. O motivo da depreciação original (2026-04-18) foi que `brand_permission_config` não era consumido em runtime — controle real é `brand_modules` (Central de Módulos). Modelos de Negócio reforça essa decisão (sub-fase 5.7 sincroniza `brand_business_models → brand_modules` via trigger).

**Recomendação:** **Manter intocada.** Página já é uma tombstone funcional com mensagem clara. Apenas registrar formalmente no `DEPRECATION_LOG.md` para deixar histórico em um único lugar consolidado. Não mexer em sidebar/journey/help nesta fase (out of scope conservador).

## 2. ATENÇÃO — descoberta crítica sobre depreciação de tabelas

A diretriz do usuário fala em "DEPRECATED" para `city_module_overrides` e `plan_module_templates`. Mas a investigação mostra que **ambas continuam ativamente em uso pelo fluxo legado de módulos técnicos**:

| Tabela | Consumidores ativos hoje |
|---|---|
| `city_module_overrides` | `hook_modulos_resolvidos.ts` (Realtime + cascata sidebar), `hook_city_overrides.ts` (Central de Módulos por cidade), `hook_catalogo.ts` |
| `plan_module_templates` | `PlanModuleTemplatesPage.tsx` (UI do Raiz, ainda no menu RootSidebar), Edge Function `apply-plan-template` |

**Ajuste de redação do COMMENT** (mantendo o espírito conservador):

```sql
COMMENT ON TABLE public.city_module_overrides IS
  'Overrides técnicos de módulos por cidade. Para o fluxo novo de Modelos de Negócio (Sub-fase 5.6+) usar city_business_model_overrides. Esta tabela permanece ativa para o caminho legado da Central de Módulos. Re-avaliar após validação completa do beta Ubiz Resgata.';

COMMENT ON TABLE public.plan_module_templates IS
  'Templates de módulos técnicos por plano. Para o fluxo novo de Modelos de Negócio (Sub-fase 5.3+) usar plan_business_models. Esta tabela permanece ativa para o caminho legado de Perfil de Planos. Re-avaliar após validação completa do beta Ubiz Resgata.';
```

Sem `DEPRECATED` cru — porque hoje ainda são as tabelas operacionais para 100% das brands fora do beta. Quando o beta expandir para todas, aí sim depreciamos formal. O `DEPRECATION_LOG.md` deixa isso explícito.

## 3. Banner em `PlanModuleTemplatesPage.tsx`

Adicionar `<Alert variant="default">` no topo do JSX (logo após `<PageHeader>`), com ícone `AlertTriangle`, texto:

> ⚠️ **Tela legada.** Esta configuração será substituída por **Modelos × Planos** (parte da nova arquitetura de Modelos de Negócio). Para brands em beta, configure em **Central de Módulos → Modelos × Planos**. Esta tela continua funcional e é a fonte para todas as brands fora do beta.

Sem alterar comportamento. Sem remover do menu.

## 4. Arquivos

**Criados (1):**
- `DEPRECATION_LOG.md` (raiz do projeto, junto com `ARCHITECTURE_DECISION_RECORD.md` e `TECH_DEBT.md`)

**Editados (2):**
- `src/pages/PlanModuleTemplatesPage.tsx` — adicionar banner Alert no topo (~10 linhas)
- **`BUSINESS_MODELS_ARCHITECTURE.md` não existe** — vou **criá-lo** ao invés de "atualizar". Vai conter o histórico de execução das sub-fases 5.1 a 5.9 + visão geral da arquitetura final + ponteiros para os arquivos-chave (RPCs, hooks, trigger, tabelas). Isso vira o documento canônico que a diretriz pediu.

Total final:
- **Criados:** `DEPRECATION_LOG.md`, `BUSINESS_MODELS_ARCHITECTURE.md`
- **Editado:** `src/pages/PlanModuleTemplatesPage.tsx` (banner)
- **Migration SQL:** 1 arquivo só com 2 `COMMENT ON TABLE` (zero risco, idempotente)

## 5. Conteúdo do `DEPRECATION_LOG.md` (estrutura)

```
# Log de Depreciações — Vale Resgate

## 2026-04-19 — Sub-fase 5.9: Modelos de Negócio em beta

### Status: DEPRECAÇÃO PARCIAL (apenas para brands em beta)
A flag `business_models_ui_enabled` controla quem usa a nova
arquitetura. Hoje: apenas Ubiz Resgata
(db15bd21-9137-4965-a0fb-540d8e8b26f1).

### city_module_overrides (tabela)
- Substituída por: city_business_model_overrides (5.6)
- Status: ativa para fluxo legado, COMMENT SQL adicionado
- Ainda consumida por: hook_modulos_resolvidos, hook_city_overrides,
  hook_catalogo
- Remoção prevista: após beta validar e expandir para 100% das brands
- Rollback: remover COMMENT

### plan_module_templates (tabela)
- Substituída por: plan_business_models (5.3)
- Status: ativa para fluxo legado, COMMENT SQL adicionado
- Ainda consumida por: PlanModuleTemplatesPage, edge apply-plan-template
- Remoção prevista: idem
- Rollback: remover COMMENT

### /plan-templates (rota e página)
- Substituída por: /brand-modules → aba "Modelos de Negócio" → "Modelos × Planos"
  (apenas para brands em beta)
- Status: rota e link no RootSidebar mantidos. Banner de aviso adicionado no topo.
- Remoção prevista: fase 6
- Rollback: remover banner

### /brand-permissions (rota e BrandPermissionOverflowPage)
- Já estava depreciada desde 2026-04-18 (Caminho B do diagnóstico
  pré-Modelos de Negócio)
- Substituída por: Central de Módulos (/admin/central-modulos)
- Status: tela é tombstone informativa; tabela brand_permission_config
  preservada com dados intactos
- Remoção prevista: avaliar junto com city_module_overrides
- Rollback: nenhum (já é só uma página de aviso)

### Contexto
Parte do rollout de Modelos de Negócio (Sub-fases 5.1–5.9),
documentado em BUSINESS_MODELS_ARCHITECTURE.md.
```

## 6. Conteúdo do `BUSINESS_MODELS_ARCHITECTURE.md` (estrutura)

Seções:
1. Visão geral (problema, solução, decisões fundamentais)
2. Modelo de dados (catálogo `business_models`, ligações N-N, overrides, pricing GG)
3. RPCs principais (`resolve_active_business_models`, `rpc_gg_report_*`)
4. Hooks-chave (`useResolvedBusinessModels`, `useBusinessModelsUiEnabled`, etc.)
5. Trigger de sincronização (Sub-fase 5.7)
6. UI por persona (Raiz / Empreendedor / Filial / Loja)
7. Beta gate (`brand_settings_json.business_models_ui_enabled === true`)
8. Relatórios e exports (5.8)
9. Convivência com fluxo legado (link p/ DEPRECATION_LOG)
10. Fluxo de rollback global (1 UPDATE para flag = OFF)
11. Permissões e RLS
12. Audit log (entity types e actions)
13. Pendências (Fase 4.1b travada, Fase 4.3c pendente, expansão pós-beta)
14. **Histórico de execução** (5.1–5.9 com data, escopo entregue, arquivos principais)

## 7. Migração SQL

```sql
-- Sub-fase 5.9 — Depreciação conservadora (apenas COMMENTs)
COMMENT ON TABLE public.city_module_overrides IS
  'Overrides técnicos de módulos por cidade. Para Modelos de Negócio (5.6+) usar city_business_model_overrides. Tabela permanece ativa para fluxo legado da Central de Módulos.';

COMMENT ON TABLE public.plan_module_templates IS
  'Templates de módulos técnicos por plano. Para Modelos de Negócio (5.3+) usar plan_business_models. Tabela permanece ativa para fluxo legado de Perfil de Planos.';
```

Idempotente, sem efeito em dados, RLS ou índices.

## 8. Estimativa
- Tempo: ~10–15 min
- LOC: ~250 (docs MD) + ~10 (banner JSX) + 4 (SQL)
- Commit atômico único
- `npx tsc --noEmit` esperado limpo (apenas adição de Alert visual)

## 9. Rollback (item por item)

| Ação | Como reverter |
|---|---|
| `DEPRECATION_LOG.md` | Deletar arquivo |
| `BUSINESS_MODELS_ARCHITECTURE.md` | Deletar arquivo |
| Banner em `PlanModuleTemplatesPage.tsx` | Remover bloco `<Alert>` (linhas isoladas) |
| `COMMENT ON TABLE city_module_overrides` | `COMMENT ON TABLE public.city_module_overrides IS NULL;` |
| `COMMENT ON TABLE plan_module_templates` | `COMMENT ON TABLE public.plan_module_templates IS NULL;` |

Zero código operacional alterado. Zero RLS. Zero dados afetados. Zero alterações em audit_logs/trigger 5.7. Beta flag intocada.

## 10. Riscos
**Mínimos.** Apenas docs + 1 banner visual + 2 COMMENTs SQL. Não há caminho que regrede comportamento. Único cuidado: validar que o componente `Alert` já está importado em `PlanModuleTemplatesPage.tsx` ou adicionar o import.


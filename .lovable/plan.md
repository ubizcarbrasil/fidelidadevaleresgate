

# Sub-fase 5.5 — Painel do Empreendedor reformulado

## Respostas às 7 questões

### 1. Estratégia de flag per-brand: `brand_settings_json` (jsonb)

**Escolha: nem coluna nova nem tabela nova.** Reutilizar `brands.brand_settings_json` já existente, adicionando a chave `business_models_ui_enabled: true`.

**Por quê:**
- Zero migration de schema. Sub-fase 5.5 fica 100% sem ALTER TABLE.
- Padrão já adotado no projeto: várias features usam `brand_settings_json` (sidebar order, theme, flags de cidade).
- Expansão de beta = 1 UPDATE JSONB, sem deploy de código.
- Para ligar/desligar uma brand: `UPDATE brands SET brand_settings_json = jsonb_set(brand_settings_json, '{business_models_ui_enabled}', 'true') WHERE id = '<uuid>'`.
- Helper `useBusinessModelsUiEnabled(brandId)` retorna `USE_BUSINESS_MODELS_GLOBAL || brand_settings_json.business_models_ui_enabled === true`.
- Migration única (one-time) liga apenas Ubiz Resgata: 1 UPDATE.

### 2. Estratégia de tela: **Opção C — nova aba dentro de `/brand-modules`**

**Por quê:**
- A) substituir é arriscado: a página atual lida com home sections, sidebar order, etc. Não dá pra jogar fora.
- B) rota paralela duplica navegação e gera confusão (2 menus "Módulos").
- D) seria adicionar `/brand-business-models` como rota separada — discutida e rejeitada pela mesma razão.
- **C** preserva a UI antiga **sempre** (qualquer brand acessa as abas que sempre existiram). A aba "Modelos de Negócio" só aparece quando `useBusinessModelsUiEnabled(brand) === true`. Rollback = remover 1 condicional.

Estrutura final de `BrandModulesPage`:
- Tabs já existentes (módulos técnicos, home order, sidebar order) — intocadas.
- **Nova aba** (1ª, `default`): "Modelos de Negócio" — só aparece se flag/opt-in ativo. Caso contrário, default vai pra aba antiga.

### 3. Mockup das 2 telas

**Tela A — Aba "Modelos de Negócio" em /brand-modules**
```
┌──────────────────────────────────────────────────────────────────┐
│ Meus Modelos de Negócio                       [Plano: Profis. ↗] │
│ 5 de 13 modelos ativos          [⚙ Configurar Ganha-Ganha]      │
├──────────────────────────────────────────────────────────────────┤
│ CLIENTE (4)                                                      │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────┐ │
│ │▌🎁 Achadinho│ │▌⭐ Pontua Cli│ │🔒 Resgate Pts│ │🔒 Cidade │ │
│ │  ativo • 3🏙│ │  ativo       │ │ Plano Profis.│ │ Profis.  │ │
│ │  [●━━━ on] │ │  [●━━━ on]  │ │ [Fazer up..] │ │[upgrade] │ │
│ └──────────────┘ └──────────────┘ └──────────────┘ └──────────┘ │
│                                                                  │
│ MOTORISTA (8)                                                    │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐              │
│ │▌🚗 Achadinho│ │▌🏆 Duelo Mot│ │▌👑 Cinturão │  ...           │
│ │  inativo    │ │  inativo    │ │  inativo    │                 │
│ │  [○━━━ off]│ │  [○━━━ off]│ │  [○━━━ off]│                 │
│ └──────────────┘ └──────────────┘ └──────────────┘              │
│                                                                  │
│ B2B (1)                                                          │
│ ┌──────────────────────┐                                         │
│ │▌🤝 Ganha-Ganha       │                                         │
│ │  ativo • margem 50% │                                         │
│ │  [●━━ on] [Configurar →]                                       │
│ └──────────────────────┘                                         │
└──────────────────────────────────────────────────────────────────┘

Estados:
- Disponível+Ativo: switch ON, barra colorida lateral, pode mostrar "X cidades override"
- Disponível+Inativo: switch OFF, opacity-90, ação "Ativar"
- Fora do plano: opacity-40, Lock icon centro, badge "Plano X", CTA "Fazer upgrade"
```

**Tela B — `/brand-modules/ganha-ganha` (sub-rota)**
```
┌──────────────────────────────────────────────────────────────────┐
│ ← Voltar para Modelos                                            │
│ Configurar Ganha-Ganha — Cashback Inteligente                    │
├──────────────────────────────────────────────────────────────────┤
│ Como funciona                                                    │
│ ┌──────────┐  →  ┌──────────────┐  →  ┌────────┐                │
│ │ 🏛 Raiz  │     │ 🏢 Empreend. │     │ 🏪 Loja│                │
│ │R$ 0,10/p │     │ + sua margem │     │ paga   │                │
│ └──────────┘     └──────────────┘     └────────┘                │
├──────────────────────────────────────────────────────────────────┤
│ Sua margem sobre o preço do Raiz                                 │
│ Faixa permitida pelo plano Profissional: 20% a 80%               │
│ Margem atual: [50] %         Preço final cobrado: R$ 0,15/ponto  │
│ ⚠ Margem informada está dentro da faixa.                         │
│ [Salvar margem]                                                  │
├──────────────────────────────────────────────────────────────────┤
│ Simulador (mesmo da Central, plano travado)                      │
│ Plano: Profissional (readonly)                                   │
│ Pontos/mês: [10000]   Margem: 50% (sincr. acima)                │
│ → Custo: R$ 1.000  Receita: R$ 1.500  Margem líquida: R$ 500    │
└──────────────────────────────────────────────────────────────────┘
```

### 4. Script one-time de seed `brand_modules` da Ubiz: **PULAR para 5.7**

**Por quê:** sub-fase 5.5 explicitamente desacoplou as duas tabelas. Ubiz Resgata já tem `brand_modules` populado pelo fluxo legado (a brand existe há tempos com módulos ligados). Seed dos `business_models` ativos já não muda nada técnico até a 5.7 sincronizar. Trigger de sincronização entra na 5.7 com lógica completa (e idempotência). Forçar sync agora pode duplicar/sobrescrever escolhas manuais já feitas pela Ubiz no painel antigo.

**O que faremos no seed da 5.5:** apenas marcar `brand_settings_json.business_models_ui_enabled = true` em Ubiz Resgata (db15bd21-9137-4965-a0fb-540d8e8b26f1). Nada mais.

### 5. Arquivos

**Novos (8):**
| Arquivo | Função |
|---|---|
| `src/compartilhados/hooks/hook_business_models_ui_flag.ts` | `useBusinessModelsUiEnabled(brandId)` — combina flag global + opt-in da brand |
| `src/compartilhados/hooks/hook_brand_business_models.ts` | `useBrandBusinessModels`, `useToggleBrandBusinessModel`, `useUpdateGanhaGanhaMargin` |
| `src/compartilhados/hooks/hook_brand_plan_business_models.ts` | Combinador: available / active / locked por brand+plano |
| `src/features/painel_modelos_negocio/aba_modelos_negocio_brand.tsx` | Wrapper da nova aba (header + grid) |
| `src/features/painel_modelos_negocio/components/header_modelos_brand.tsx` | Título + contador + plano + CTA Configurar GG |
| `src/features/painel_modelos_negocio/components/grid_modelos_brand.tsx` | Grid agrupado por audience |
| `src/features/painel_modelos_negocio/components/card_modelo_brand.tsx` | Card 3 estados (ativo/inativo/locked) |
| `src/features/painel_modelos_negocio/pagina_configurar_ganha_ganha.tsx` | Página da rota /brand-modules/ganha-ganha |

**Editados (3):**
- `src/pages/BrandModulesPage.tsx` — adicionar 1ª aba condicional "Modelos de Negócio" via `useBusinessModelsUiEnabled`
- `src/App.tsx` — adicionar rota filha `brand-modules/ganha-ganha`
- `src/features/painel_modelos_negocio/components/card_modelo_brand.tsx` reutilizando o `simulador_financeiro_gg.tsx` da 5.4 (com prop `lockedPlan`)

**Migration (1, dados — usa insert tool):**
- 1 UPDATE em `brands` setando `brand_settings_json.business_models_ui_enabled = true` para `db15bd21-9137-4965-a0fb-540d8e8b26f1`

**Edição em componente existente da 5.4 (1):**
- `src/features/central_modulos/components/simulador_financeiro_gg.tsx` — adicionar prop opcional `lockedPlanKey?: string` que esconde o seletor de plano

### 6. Estimativa
- **Tempo:** ~25–30 min
- **LOC:** ~1100–1300
- **Commit:** atômico único
- **Rollback:** remover condicional de aba (1 linha), `UPDATE brands SET brand_settings_json = brand_settings_json - 'business_models_ui_enabled' WHERE id = '...'`, deletar 8 arquivos novos

### 7. Testes de aceite
1. Login como Ubiz Resgata → aba "Modelos de Negócio" aparece em `/brand-modules`
2. Login como qualquer outra brand → aba **NÃO** aparece, página antiga inalterada
3. Toggle ON num modelo do plano → INSERT em brand_business_models, audit log gravado
4. Toggle OFF → UPDATE is_enabled=false, audit log
5. Card de modelo fora do plano mostra Lock + CTA, switch desabilitado
6. Click "Configurar →" no card Ganha-Ganha → navega pra `/brand-modules/ganha-ganha`
7. Salvar margem em GG → UPDATE brand_business_models.ganha_ganha_margin_pct, audit log
8. Margem fora da faixa min/max → alerta visual, salva mesmo assim (validação só visual nesta fase)
9. Simulador atualiza preço final em tempo real
10. `npx tsc --noEmit` exit 0
11. brand_modules da Ubiz Resgata permanece intocado (separação garantida)

### Audit log
- entity_type: `brand_business_model`
- actions: `model_activated` | `model_deactivated` | `ganha_ganha_margin_updated`
- changes: `{ model_key, brand_id, from, to }`

### Riscos
- **Baixos**: aba nova é condicional + opt-in explícito por brand. Se algo quebrar visualmente, basta desligar o JSON flag (UPDATE de 1 segundo). Código antigo zero-tocado.
- Hooks novos não afetam consumidores existentes.


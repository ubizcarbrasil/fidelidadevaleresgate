

# Sub-fase 5.3 — UI Raiz: Modelos de Negócio + Matriz × Planos + Badges

## Respostas às 8 questões

1. **Delete**: Confirmado — **NÃO** permitir delete nesta sub-fase. Apenas toggle `is_active` (soft-delete). Card de modelo inativo fica com `opacity-60` igual ao padrão da aba Catálogo. Hard-delete fica para sub-fase futura com confirmação dupla mostrando quantas marcas/cidades serão impactadas.

2. **Ordem das badges no Catálogo**: Confirmado — **required primeiro (sólidas), depois optional (outlined), ambos em ordem alfabética** dentro do grupo. Truncar nome em 14 chars. Máximo 3 visíveis + popover "+N".

3. **Hook CRUD separado**: Confirmado — criar `hook_modelos_negocio_crud.ts` com mutations isoladas. Cada mutation invalida 3 queryKeys: `["business-models-catalog"]`, `["resolved-business-models", *]` (refetch global), e `["business-model-modules", modelId]` quando vínculos mudam. Mantém `useResolvedBusinessModels` puro (read-only resolvido).

4. **Audit log**: Confirmado — escrever em `audit_logs` com `entity_type='business_model'` ou `'plan_business_model'` ou `'business_model_modules'`. Action: `created` | `updated` | `toggled_active` | `module_linked` | `module_unlinked` | `plan_included` | `plan_excluded`. Trigger DB virá na 5.7; nesta fase, escrita feita pelo cliente após mutation OK (mesmo padrão de 4.1a/4.1b).

5. **Estilo dos cards**: Confirmado — **variante distinta**. Cards maiores (h ~140px), barra lateral colorida de 4px com a `color` do modelo, ícone grande (h-10 w-10) em chip arredondado, título em `text-base font-semibold`, badges de audience+pricing no topo direito, contador "usa X módulos" como texto secundário no rodapé. Visual claramente "produto comercial" vs cards técnicos da aba Catálogo.

6. **Mockup textual**: ver seção "Mockups" abaixo.

7. **Responsividade**: Confirmado — desktop-first. Grid `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` para cards. Matriz Modelos×Planos com scroll horizontal em mobile (`overflow-x-auto`), coluna fixa com nome do modelo via `sticky left-0`.

8. **Estimativa**: ~10 arquivos novos + 2 edições, ~1500–1800 LOC TS/TSX, **~25–35 minutos** de execução (inclui tsc + commit atômico).

---

## Mockups das duas tabs

### Tab "Catálogo de Modelos"

```text
┌─────────────────────────────────────────────────────────────────┐
│ [🔍 buscar modelo...]                          [+ Novo Modelo]  │
│ [Todos 13] [Cliente 4] [Motorista 8] [B2B 1]                    │
├─────────────────────────────────────────────────────────────────┤
│ CLIENTE (4)                                                     │
│ ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐ │
│ │▌🎁 Achadinho... │ │▌⭐ Pontua Cliente│ │▌🔁 Resgate Pts..│ │
│ │  cliente · incl.│ │  cliente · incl. │ │  cliente · incl. │ │
│ │  Vitrine de    │ │  Acúmulo de     │ │  Resgate por     │ │
│ │  ofertas...    │ │  pontos por...  │ │  produtos...     │ │
│ │  ─────────     │ │  ─────────      │ │  ─────────       │ │
│ │  9 módulos     │ │  6 módulos      │ │  10 módulos      │ │
│ └──────────────────┘ └──────────────────┘ └──────────────────┘ │
│                                                                 │
│ MOTORISTA (8)                                                   │
│ ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐ │
│ │▌🚗 Achadinho M. │ │▌🏆 Duelo M.    │ │▌👑 Cinturão M.  │ │
│ │  motorista·incl.│ │  motorista·incl │ │  motorista·incl. │ │
│ │  ...             │ │  ...             │ │  ...             │ │
│ └──────────────────┘ └──────────────────┘ └──────────────────┘ │
│ (...continua)                                                   │
│                                                                 │
│ B2B (1)                                                         │
│ ┌──────────────────┐                                            │
│ │▌🤝 Ganha-Ganha  │                                            │
│ │  b2b · usage    │                                            │
│ │  Ecossistema... │                                            │
│ │  11 módulos     │                                            │
│ └──────────────────┘                                            │
└─────────────────────────────────────────────────────────────────┘

Click em qualquer card → Dialog de edição (3 seções):
  1. Identidade: name, description, icon, color, sort_order, is_active
  2. Imutáveis: key, audience, pricing_model (cinza, read-only)
  3. Vínculos com Módulos Técnicos:
     [busca módulo...]
     ☑ points · Pontos                           [Required ⚪→🟢]
     ☑ stores · Lojas                            [Required ⚪→🟢]
     ☐ home_sections · Seções da Home            [Optional ○→○]
     (lista dos 82 módulos com checkbox + switch req/opt)
```

### Tab "Modelos × Planos"

```text
┌─────────────────────────────────────────────────────────────────┐
│ Matriz Modelos × Planos                  [Ações em massa ▼]     │
├─────────────────────────────────────────────────────────────────┤
│                       │  Free  │ Starter │ Profis. │ Enterpr. │ │
│                       │ (13)   │  (13)   │  (13)   │  (13)    │ │
├───────────────────────┼────────┼─────────┼─────────┼──────────┤ │
│ CLIENTE                                                         │
│ achadinho_cliente     │  ☑    │   ☑    │   ☑    │   ☑     │ │
│ pontua_cliente        │  ☑    │   ☑    │   ☑    │   ☑     │ │
│ resgate_pontos_cli.   │  ☑    │   ☑    │   ☑    │   ☑     │ │
│ resgate_cidade_cli.   │  ☑    │   ☑    │   ☑    │   ☑     │ │
│ MOTORISTA                                                       │
│ achadinho_motorista   │  ☑    │   ☑    │   ☑    │   ☑     │ │
│ pontua_motorista      │  ☑    │   ☑    │   ☑    │   ☑     │ │
│ duelo_motorista       │  ☑    │   ☑    │   ☑    │   ☑     │ │
│ aposta_motorista      │  ☑    │   ☑    │   ☑    │   ☑     │ │
│ cinturao_motorista    │  ☑    │   ☑    │   ☑    │   ☑     │ │
│ resgate_pontos_mot.   │  ☑    │   ☑    │   ☑    │   ☑     │ │
│ resgate_cidade_mot.   │  ☑    │   ☑    │   ☑    │   ☑     │ │
│ rank_motorista        │  ☑    │   ☑    │   ☑    │   ☑     │ │
│ B2B                                                             │
│ ganha_ganha           │  ☑    │   ☑    │   ☑    │   ☑     │ │
└─────────────────────────────────────────────────────────────────┘

Click checkbox → mutation otimista → invalida → audit log
"Ações em massa" → Dialog: [select plano] + [select all/none] + apply
Mobile: scroll horizontal, primeira coluna sticky com fundo sólido
```

### Badges no Catálogo (Tab existente)

```text
┌─────────────────────────────────────────────────────────────────┐
│ 🟦 points · Pontos                                              │
│    [pontua_cli] [pontua_mot] [resgate_pts_cli] +5    [Building2 X] [MapPin X] │
│    └─ sólidas (required)                  └─ +N popover         │
│                                                                 │
│ 🟦 brand_settings · Configurações                               │
│    [Transversal]                                                │
└─────────────────────────────────────────────────────────────────┘
```

---

## Arquitetura técnica

### Hooks novos

**`hook_modelos_negocio_crud.ts`**
- `useBusinessModelsCatalog()` → SELECT * FROM business_models ORDER BY audience, sort_order
- `useBusinessModelModules(modelId)` → SELECT * FROM business_model_modules + JOIN module_definitions
- `useCreateBusinessModel()` → INSERT + audit
- `useUpdateBusinessModel()` → UPDATE com `.select()` + audit
- `useToggleBusinessModelActive()` → UPDATE is_active + audit
- `useSetBusinessModelModule()` → UPSERT business_model_modules (link/unlink + req/opt) + audit
- `useModulesGroupedByModel()` → query agregadora para badges no Catálogo (Map<module_id, Array<{model, is_required}>>)

**`hook_plan_business_models.ts`**
- `usePlanBusinessModelsMatrix()` → SELECT * FROM plan_business_models
- `useTogglePlanBusinessModel()` → UPSERT/DELETE + audit
- `useBulkSetPlan()` → bulk include/exclude todos os modelos de um plano

### Componentes novos (10 arquivos)

| Arquivo | Função |
|---|---|
| `aba_modelos_negocio.tsx` | Wrapper com `<Tabs>` interno (Catálogo de Modelos / Modelos × Planos) |
| `secao_catalogo_modelos.tsx` | Grid agrupado por audience + busca + botão "Novo" |
| `secao_modelos_planos.tsx` | Tabela matriz com sticky col + bulk actions |
| `card_modelo_negocio.tsx` | Card visual distinto (barra lateral, ícone grande) |
| `dialog_editar_modelo.tsx` | Form com 3 seções (identidade, imutáveis, vínculos) |
| `dialog_criar_modelo.tsx` | Form completo + validação `key` slug-format único |
| `badge_modelo_negocio.tsx` | Badge atômica com `color`+name truncado, variante sólida/outline |
| `badges_modelos_do_modulo.tsx` | Container que recebe `module_id`, busca vínculos, renderiza max 3 + popover |

### Edições (2 arquivos)

- `pagina_central_modulos.tsx`: adicionar `<TabsTrigger value="modelos">` entre Catálogo e Planos, ajustar `grid-cols-5` → `grid-cols-6` no `TabsList` e adicionar `<TabsContent value="modelos">`. Ícone: `Briefcase` (lucide).
- `aba_catalogo.tsx`: importar `BadgesModelosDoModulo` e renderizar logo abaixo da linha de badges existentes em cada Card de módulo (linha ~130).

### Audit log padrão

```ts
await supabase.from("audit_logs").insert({
  entity_type: "business_model",
  entity_id: modelId,
  action: "updated",
  changes: { name: { from, to } },
  actor_id: userId,
});
```

### Realtime

Já tratado pelo `useResolvedBusinessModels` da 5.2 (que outros consumidores usarão futuramente). Os novos hooks CRUD usam `staleTime: 30s` + invalidação manual após mutation; **não** subscrevem Realtime adicional para não duplicar canais.

---

## Plano de execução (commit atômico único)

1. Criar 10 arquivos novos (hooks + componentes)
2. Editar `pagina_central_modulos.tsx` (adicionar tab)
3. Editar `aba_catalogo.tsx` (renderizar badges)
4. `npx tsc --noEmit` (esperado exit 0)
5. Commit único

## Rollback trivial

- Reverter as 2 edições (página central e aba catálogo)
- Deletar os 10 arquivos novos
- Sem mudanças de schema. Sem migrations. Zero impacto em dados.

## Riscos

- **Baixos**: nada existente quebra. Aba nova é aditiva. Badges no Catálogo só somam visual; se a query de vínculos falhar, fallback é renderizar nada (não bloqueia o card).
- Flag `USE_BUSINESS_MODELS` permanece `false` — nenhum consumidor downstream é afetado.
- Audit logs novos usam tabela existente — sem migração.

## Entregáveis pós-execução

1. Lista dos 10 arquivos criados + 2 editados
2. Exit code do `npx tsc --noEmit`
3. Screenshot textual confirmando: aba aparece entre Catálogo e Planos, 13 cards renderizam, matriz mostra 13×4=52 checkboxes marcadas, badges aparecem nos módulos do Catálogo


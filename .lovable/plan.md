## Objetivo

Encerrar o plano de governança de produtos comerciais resolvendo os 4 itens pendentes: ajustar o hook que ainda força módulos extras, criar a página de **Diagnóstico por Marca**, adicionar **Preview no Wizard de Produtos** e implementar **testes de integração** que travam regressões no provisionamento.

---

## Etapa 1 — Ajuste crítico no `useBrandModules` (fecha a Parte A)

Hoje o hook tem `csv_import` no `ALWAYS_ON_MODULES` hardcoded. Como o banco já não considera mais `csv_import` como core, isso faz com que **toda marca continue vendo o módulo** mesmo sem ele estar no produto contratado — anula parte do fix da migration.

**Mudança em `src/hooks/useBrandModules.ts`:**
- Remover `"csv_import"` do `ALWAYS_ON_MODULES`.
- Deixar apenas os 3 reais: `brand_settings`, `subscription`, `users_management`.
- Adicionar comentário curto referenciando a migration A1 para evitar regressão futura.

---

## Etapa 2 — Página de Diagnóstico por Marca (item C1)

Nova feature seguindo o padrão do workspace.

**Estrutura:**
```text
src/features/diagnostico_marca/
├── pagina_diagnostico_marca.tsx
├── components/
│   ├── cabecalho_diagnostico.tsx
│   ├── tabela_modulos_origem.tsx
│   ├── card_resumo_produto.tsx
│   └── dialog_diff_template.tsx
├── hooks/
│   └── hook_diagnostico_marca.ts
├── services/
│   └── servico_diagnostico_marca.ts
├── types/
│   └── tipos_diagnostico.ts
└── utils/
    └── utilitarios_origem_modulo.ts
```

**Rota:** `/admin/diagnostico-marca/:brandId` registrada em `src/App.tsx` dentro de `RootGuard` (apenas root_admin).

**Funcionalidades da página:**
1. **Cabeçalho** com nome da marca, produto atual (`subscription_plan`), data da última aplicação de template e botão **"Ver como esta marca"** (abre `/?brandId=...`).
2. **Tabela de módulos ativos** com 4 colunas marcando a origem de cada um:
   - Núcleo (`is_core = true`)
   - Produto (presente em `plan_module_templates` do plano da marca)
   - Modelo de Negócio (derivado de `brand_business_models` → `business_model_modules`)
   - Override Manual (existe em `brand_modules` mas não cai em nenhuma das 3 acima)
3. **Botão "Reaplicar template do produto"** chamando a edge function `apply-plan-template` já corrigida no passo A4.
4. **Botão "Comparar com template"** abre `dialog_diff_template.tsx` mostrando: módulos sobrando (na marca, fora do template) e módulos faltando (no template, fora da marca).

**Acesso na lista de marcas:** adicionar item **"Diagnosticar marca"** no `DropdownMenu` de cada marca em `src/pages/Brands.tsx` (mesmo grupo do botão "Ver como esta marca").

**Lógica de origem (em `utilitarios_origem_modulo.ts`):**
Função pura `classificarOrigem(modulo, contexto)` que recebe `{ moduleKey, isCore, templateKeys, businessModelKeys }` e retorna um array de origens. Reaproveitada nos testes.

---

## Etapa 3 — Preview no Wizard de Produtos (item B1)

Novo passo no wizard, **antes** do passo de Revisão.

**Arquivos:**
- `src/features/produtos_comerciais/components/passo_preview.tsx` (novo)
- `src/features/produtos_comerciais/utils/utilitarios_simulacao_sidebar.ts` (novo) — função pura que dado `{ moduleKeys, businessModelKeys }` devolve a estrutura do menu filtrada (extraída da lógica do `BrandSidebar`).
- `src/features/produtos_comerciais/components/wizard_produto.tsx` (editar) — inserir o passo entre `modules`/`landing` e `review`.

**Conteúdo da tela de preview:**
1. **Sidebar simulado** renderizado em uma coluna estreita à esquerda usando os módulos selecionados + os 3 cores (mesma lógica do console real).
2. **Lista de módulos divididos em 2 colunas** à direita:
   - **Forçados pelo núcleo** — com ícone de cadeado, não editáveis.
   - **Vindos da sua seleção** — com link "voltar para editar" que retorna ao passo de módulos.
3. **Rotas acessíveis vs bloqueadas** — lista derivada do `MENU_REGISTRY` filtrada pela seleção.
4. **Aviso de promessa** — se o produto tem benefícios em `landing_config_json.benefits` cujo `module_key` declarado não estiver na seleção, mostra alerta vermelho listando os benefícios "prometidos mas não entregues".

---

## Etapa 4 — Testes de integração de promessa do produto (item D1)

Novo arquivo `src/features/produtos_comerciais/__tests__/promessa_produto.integration.test.ts`.

**Cobertura:**
1. Para cada `subscription_plans` ativo no banco (mockado via fixture):
   - Simula provisionamento chamando a função pura de cálculo de módulos finais (`calcularModulosFinais({ planKey, coreModules, templateModules, businessModelModules })` extraída da lógica de `provision-brand`).
   - Assert: o resultado contém **exatamente** `core ∪ template`. Nada a mais, nada a menos.
2. Valida que o módulo `csv_import` **não aparece** automaticamente em produtos que não o incluem (regressão da Ubiz Shop).
3. Valida que `change_plan` (lógica em função pura `calcularDeltaTrocaPlano`) gera o `INSERT`/`DELETE` correto de `brand_modules` ao trocar de produto.
4. Valida que `classificarOrigem` (utilidade da Etapa 2) marca corretamente cada cenário: só núcleo, só produto, núcleo+produto, override manual.

Roda no CI via `vitest` (já configurado em `vitest.config.ts` e `.github/workflows/ci.yml`).

---

## Ordem de execução

1. **Etapa 1** — Ajuste no `useBrandModules` (1 arquivo, ~1 minuto, fecha a Parte A de fato).
2. **Etapa 2** — Diagnóstico por Marca (página + rota + link no menu de marcas). É a ferramenta que dá poder pro Root Admin auditar a Ubiz Shop e qualquer marca futura.
3. **Etapa 3** — Preview no Wizard (impede que produtos sejam salvos sem que o criador veja o que entregam).
4. **Etapa 4** — Testes de integração (trava regressões automaticamente no CI).

---

## Detalhes técnicos

- **Lógica compartilhada de filtragem de menu:** vou extrair a lógica atual do `BrandSidebar` para uma função pura em `src/compartilhados/utils/utilitarios_filtro_menu.ts`, consumida tanto pelo sidebar real quanto pelo preview do wizard e pela página de diagnóstico. Mantém uma fonte única de verdade.
- **Sem novas tabelas:** todo o diagnóstico é derivado de `brand_modules`, `module_definitions`, `plan_module_templates`, `brand_business_models`, `business_model_modules`.
- **Memória de impersonação:** o botão "Ver como esta marca" já existe (criado na fase anterior) e usa `?brandId=` validado pelo `useBrandGuard` (memória `brand-impersonation-logic`). O diagnóstico apenas reaproveita.
- **Nomenclatura:** todos os arquivos novos seguem snake_case em português conforme regras do workspace (`pagina_*`, `hook_*`, `servico_*`, `tipos_*`, `utilitarios_*`, `constantes_*`).
- **Design System:** página de diagnóstico usa os tokens semânticos já definidos (`bg-card`, `text-muted-foreground`, `border-border`), shadcn `Table`, `Badge`, `Card`, `Dialog`. Sem cores diretas.
- **RLS:** nenhuma alteração necessária — o root_admin já tem acesso total via `has_role`. As consultas serão feitas via Supabase client com filtros explícitos por `brand_id`.
- **Edge functions:** nenhuma nova edge function. A página de diagnóstico apenas consome `apply-plan-template` (já corrigida).
- **Guard de rota:** `/admin/diagnostico-marca/:brandId` envolvida por `RootGuard` em `App.tsx`.

---

## Resumo do que fica entregue

- `useBrandModules` alinhado com a nova lista de cores (fix do "leak" residual de `csv_import`).
- Nova página `/admin/diagnostico-marca/:brandId` com auditoria completa de origem de módulos por marca.
- Botão de acesso ao diagnóstico no menu de cada marca em `Brands.tsx`.
- Novo passo "Pré-visualizar Produto" no wizard, com sidebar simulado e validação de promessa.
- Suíte de testes `promessa_produto.integration.test.ts` validando provisionamento, troca de plano e classificação de origem.
- Função pura compartilhada de filtragem de menu, garantindo que sidebar real, preview do wizard e diagnóstico falem a mesma língua.

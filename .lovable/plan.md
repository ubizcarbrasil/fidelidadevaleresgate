## Contexto

A marca **Ubiz Shop** recebeu o produto **ACHADINHOS**, mas o sidebar dela mostra Programa de Fidelidade, Gamificação, Equipe & Acessos, Inteligência & Dados, Integrações & API e Configurações — coisas que não deveriam vir nesse produto.

Investiguei o banco e a aplicação está **coerente** com o template do produto (18 módulos no template, 18 ativos na marca). O problema está na configuração do template e em como o sistema o constrói.

### Causas-raiz

1. **`is_core = true` força módulos em TODOS os produtos.** 10 módulos hoje são core: `brand_settings, csv_import, customers, home_sections, offers, redemption_qr, stores, subscription, users_management, wallet`. Mesmo que você não marque no wizard do Achadinhos, eles entram. Os grupos do sidebar ficam visíveis porque pelo menos um item core dentro deles passou no filtro.

2. **`change_plan` não sincroniza módulos.** A edge function só atualiza `brands.subscription_plan`. Não toca em `brand_modules` nem em `brand_business_models`. Trocar o produto de uma marca hoje não troca as features.

3. **`apply-plan-template` rejeita produtos comerciais.** A whitelist aceita só `free, starter, profissional, enterprise`. Os produtos novos (`a, clienteresgata, vr_motorista_premium, ganhaganha`) não podem ser reaplicados retroativamente.

4. **Configuração espalhada e invisível.** Quem cria um produto não consegue ver "o que esse produto entrega" antes de salvar. E quem gerencia uma marca não consegue ver de onde cada módulo veio (núcleo, produto, modelo de negócio, override manual).

---

## Plano de execução

### Parte A — Fix do problema atual (resolve a Ubiz Shop)

**A1. Migration: reduzir `is_core`**

Manter como `is_core = true` apenas o mínimo estrutural (3 módulos):
- `brand_settings` (Visão Geral)
- `subscription` (Meu Plano)
- `users_management` (Gestão de Usuários)

Marcar como `is_core = false` os outros 7: `csv_import, customers, home_sections, offers, redemption_qr, stores, wallet`.

**A2. Migration data-fix: limpar `brand_modules`**

Para cada marca existente: deletar `brand_modules` cujos `module_definition_id` não estejam no `plan_module_templates` do plano atual da marca **e** não sejam dos 3 cores remanescentes. Corrige a Ubiz Shop e qualquer outra afetada.

**A3. Edge function `admin-brand-actions` — ação `change_plan`**

Após `UPDATE brands SET subscription_plan = X`:
1. `DELETE brand_modules WHERE brand_id = X`
2. `INSERT brand_modules` a partir de `plan_module_templates` do novo `plan_key` (forçando `is_enabled=true` para os 3 cores)
3. Sincronizar `brand_business_models` a partir de `plan_business_models` do novo `plan_key` (o trigger já existente cuida do resto)

**A4. Edge function `apply-plan-template` — generalizar**

Trocar a whitelist hardcoded por uma validação dinâmica: aceitar qualquer `plan_key` que exista em `subscription_plans` com `is_active = true`.

### Parte B — Visibilidade no wizard (sugestão #1)

**B1. Componente "Pré-visualizar Produto"**

Novo passo no wizard `src/features/produtos_comerciais/components/wizard_produto.tsx`, antes do passo de revisão:

- **Sidebar simulado** renderizado com os módulos selecionados (mesma lógica do `BrandSidebar`)
- Lista de módulos divididos em 2 colunas:
  - **Forçados pelo núcleo** (3 cores) — ícone de cadeado, não removíveis
  - **Vindos da sua seleção** (do passo de módulos) — editáveis
- Lista de **rotas acessíveis** vs **rotas bloqueadas** para essa configuração
- Aviso vermelho se algum módulo da promessa do produto (extraído de `landing_config_json.benefits`) não estiver na seleção

### Parte C — Diagnóstico por marca (sugestão #2)

**C1. Página `/admin/diagnostico-marca/:brandId`**

Acessível só por root_admin, com link na lista de marcas (`Brands.tsx`) no menu de ações (`...`).

Mostra:
- Produto atual + data da última aplicação
- Tabela de módulos ativos com 4 colunas de origem:
  - **Núcleo** (is_core)
  - **Produto** (veio do `plan_module_templates`)
  - **Modelo de negócio** (veio do trigger via `brand_business_models`)
  - **Override manual** (existe em `brand_modules` mas não no template e não é core)
- Botão **"Reaplicar template do produto"** (chama `apply-plan-template` corrigido)
- Botão **"Comparar com template"** — mostra o diff visual (o que está sobrando, o que está faltando)

### Parte D — Prevenção automática (sugestões #5 e #6)

**D1. Testes de integração de promessa do produto**

Novo arquivo `src/features/produtos_comerciais/__tests__/promessa_produto.integration.test.ts`:
- Para cada `subscription_plans` ativo, simula provisionamento (mock do `provision-brand`)
- Valida que apenas os módulos esperados ficam ativos (cores + template)
- Valida que rotas fora do escopo redirecionariam para `/`
- Roda no CI via `vitest`

**D2. Botão "Ver console como esta marca"**

Em `src/pages/Brands.tsx`, dentro do `DropdownMenu` de cada marca, adicionar item **"Ver como esta marca"** que abre `/?brandId={brandId}` em nova aba — aproveita o sistema de impersonação por URL já existente (`BrandContext`).

---

## Ordem de execução

1. **A1** Migration: reduzir `is_core`
2. **A2** Migration data-fix: limpar `brand_modules` desalinhados
3. **A3** Edge function `change_plan`
4. **A4** Edge function `apply-plan-template`
5. **D2** Botão "Ver como esta marca" (rápido, valida tudo visualmente)
6. **C1** Página de diagnóstico por marca
7. **B1** Preview no wizard de produtos
8. **D1** Testes de integração

---

## Detalhes técnicos

- O sidebar (`BrandSidebar`) **já oculta grupos vazios** via `if (group.items.length === 0) return null`. Após A1+A2, isso passa a funcionar de fato.
- O hook `useBrandModules` tem um `ALWAYS_ON_MODULES` hardcoded com `["brand_settings", "csv_import", "subscription", "users_management"]`. Precisa ser ajustado para refletir os 3 cores reais (sem `csv_import`).
- O trigger `sync_brand_modules_from_business_models` continua válido — ele só cuida do canal "modelo de negócio → módulos required".
- A página de diagnóstico não exige novas tabelas: tudo é derivável de `brand_modules`, `module_definitions`, `plan_module_templates`, `brand_business_models`, `business_model_modules`.
- O preview no wizard reutiliza `MENU_REGISTRY` e a lógica de filtragem do `BrandSidebar` extraída em uma função pura.
- A impersonação via `?brandId=` já é validada pelo `useBrandGuard` para root_admin (memória `brand-impersonation-logic`).

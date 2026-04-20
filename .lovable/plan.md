

# Diagnóstico — Drivetu não recebeu config do plano "Starter"

## O que aconteceu

Verifiquei a marca **Drivetu** (`d12e8e1d-...`) recém-criada. Encontrei **dois problemas distintos** que se somam:

### Problema 1 — Drivetu foi criada como `free`, não `starter`

```sql
SELECT subscription_plan FROM brands WHERE name = 'Drivetu';
-- subscription_plan = 'free'
```

O **wizard de provisionamento** (`/provision-brand` → `ProvisionBrandWizard.tsx`) **não pergunta o plano**. Ele cria a brand sem enviar `subscription_plan`, então o valor cai no default da coluna (`free`). Não existe nenhum dropdown de plano nas 5 etapas do wizard (Company → City → Branding → Sections → Review).

### Problema 2 (o mais grave) — `provision-brand` ignora os templates de plano

Mesmo se você tivesse escolhido "starter", a função **não leria a tabela `plan_module_templates`**. Veja o código atual em `supabase/functions/provision-brand/index.ts` linhas 584–615:

```ts
const BASIC_PLAN_ENABLED_KEYS = new Set([
  "affiliate_deals", "api_keys", "approvals", "banners", ... // 26 keys hardcoded
]);
const isBasicPlan = !subscription_plan
  || subscription_plan === "free"
  || subscription_plan === "basic";
// Se for "starter", "profissional" ou "enterprise" → liga TODOS os 71 módulos
is_enabled: isBasicPlan ? BASIC_PLAN_ENABLED_KEYS.has(m.key) : true
```

Resultado: o que você configurou nas abas **Central de Módulos → Planos / Modelos × Planos** simplesmente **não é consultado** durante o provisionamento. A Drivetu hoje tem **48 módulos ativos** vindos dessa lista hardcoded — não dos templates do plano free (que tem 47 ligados na tabela).

Comparação atual:

| Plano | `plan_module_templates` (configurado) | `provision-brand` (aplicado) |
|---|---|---|
| free | 47 ligados | 26 hardcoded |
| starter | 42 ligados | **todos os 71** |
| profissional | 54 ligados | **todos os 71** |
| enterprise | 56 ligados | **todos os 71** |

Os outros pontos de criação de marca (`stripe-webhook` e `apply-plan-template`) **já fazem certo** — eles leem `plan_module_templates`. Só o `provision-brand` está fora do padrão.

## Correção proposta (2 partes)

### Parte A — Wizard passa a perguntar o plano

Adicionar um Select no step **Company** (ou um novo step compacto) com as 4 opções: Free / Starter / Profissional / Enterprise. Default: `starter` (alinhado com o que `stripe-webhook` usa como fallback). Enviar `subscription_plan` no POST para a edge function.

```ts
// ProvisionBrandWizard.tsx
subscription_plan: form.subscription_plan,  // novo campo
```

### Parte B — `provision-brand` passa a aplicar `plan_module_templates`

Substituir o bloco "Step 8" da edge function pelo mesmo padrão já usado em `stripe-webhook` e `apply-plan-template`:

```ts
// 1. Aceita plan vindo do body, fallback no DB, fallback final 'free'
const requested_plan = body.subscription_plan;
const valid = ["free","starter","profissional","enterprise"];
const plan_key = valid.includes(requested_plan) ? requested_plan : "free";

// 2. Persiste o plano na brand (caso tenha vindo do body)
await supabaseAdmin.from("brands")
  .update({ subscription_plan: plan_key })
  .eq("id", brand.id);

// 3. Lê o template do plano
const { data: templates } = await supabaseAdmin
  .from("plan_module_templates")
  .select("module_definition_id, is_enabled")
  .eq("plan_key", plan_key);

// 4. Garante módulos core sempre ON
const { data: coreMods } = await supabaseAdmin
  .from("module_definitions").select("id")
  .eq("is_active", true).eq("is_core", true);
const coreIds = new Set((coreMods || []).map(m => m.id));

// 5. Substitui brand_modules pelo template (idempotente)
await supabaseAdmin.from("brand_modules").delete().eq("brand_id", brand.id);
await supabaseAdmin.from("brand_modules").insert(
  (templates || []).map((t, i) => ({
    brand_id: brand.id,
    module_definition_id: t.module_definition_id,
    is_enabled: coreIds.has(t.module_definition_id) ? true : t.is_enabled,
    order_index: i,
  }))
);
```

Remove a lista hardcoded `BASIC_PLAN_ENABLED_KEYS` (vira código morto). A fonte de verdade passa a ser **uma só**: `plan_module_templates`.

### Parte C — Reaplicar para a Drivetu (one-shot)

Você já tem a edge function `apply-plan-template` que faz exatamente isso para todas as brands de um plano. Após a correção, basta:

1. No portal Raiz, mudar o plano da Drivetu de `free` → `starter` (ou o plano que você quer testar)
2. Rodar `apply-plan-template` para `starter` (botão já existe na UI de Planos)

Isso sincroniza retroativamente sem reprovisionar nada.

## Arquivos a editar

| Arquivo | Mudança |
|---|---|
| `supabase/functions/provision-brand/index.ts` | Reescrever bloco Step 8 (linhas 584-615). Aceitar `subscription_plan` no body. Remover lista hardcoded. |
| `src/pages/ProvisionBrandWizard.tsx` | Adicionar campo `subscription_plan` no `FormData`, Select de plano no step Company, enviar no POST. |

## Riscos e rollback

- **Risco:** baixo. As outras edge functions já usam esse padrão há tempo, sem incidente.
- **Idempotência:** o `delete + insert` em `brand_modules` é seguro porque é uma brand recém-criada (sem dados de runtime dependentes daqueles módulos).
- **Rollback:** reverter os 2 arquivos. Brands criadas no meio podem ser corrigidas via `apply-plan-template`.

## Fora do escopo

- Não vou mexer em `stripe-webhook` nem `apply-plan-template` — eles já estão corretos.
- Não vou tocar em `plan_business_models` (fluxo novo de Modelos de Negócio, sub-fase 5.x). O fluxo legado de `plan_module_templates` continua sendo a fonte real para todas as brands fora do beta Ubiz Resgata, conforme definido no `DEPRECATION_LOG.md`.
- Não vou alterar a Drivetu via SQL direto — você decide o plano dela na UI depois da correção.

## Estimativa
~10 min. Commit atômico único. `npx tsc --noEmit` esperado limpo.


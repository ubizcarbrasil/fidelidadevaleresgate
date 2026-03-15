

## Plano: Templates de Módulos por Plano de Assinatura

### Contexto Atual
- Existem 2 planos (Starter R$97, Profissional R$197) + Trial gratuito
- `brands.subscription_status` rastreia TRIAL/ACTIVE/EXPIRED, mas **não armazena qual plano** foi contratado
- O provisionamento (`provision-trial`) ativa **TODOS** os módulos para qualquer marca nova
- Não existe forma de configurar quais módulos pertencem a cada plano

### O que será construído

**1. Nova tabela `plan_module_templates`**
Mapeia plano → módulos habilitados. Cada linha define se um módulo está disponível em determinado plano.

```text
plan_module_templates
├── id (uuid PK)
├── plan_key (text) — "free", "starter", "profissional"
├── module_definition_id (FK → module_definitions)
├── is_enabled (bool)
└── created_at, updated_at
```

Unique constraint em `(plan_key, module_definition_id)`.

**2. Nova coluna `subscription_plan` na tabela `brands`**
Armazena o plano ativo: `"free"`, `"starter"`, `"profissional"`. Default `"free"`.

**3. Nova página ROOT: "Perfil de Planos"**
Interface onde o ROOT configura, para cada plano, quais módulos estão ligados. Layout:
- 3 colunas (Free | Starter | Profissional)
- Cada linha = um módulo com checkbox por plano
- Módulos `is_core` ficam sempre ativos (desabilitados visualmente)
- Botão "Salvar" persiste no `plan_module_templates`

**4. Atualizar `provision-trial`**
Em vez de ativar todos os módulos, buscar `plan_module_templates` WHERE `plan_key = 'free'` e criar `brand_modules` somente com os habilitados.

**5. Atualizar `stripe-webhook`**
Quando assinatura ativa, gravar `subscription_plan` na marca e reaplicar os módulos do plano correspondente (deletar brand_modules atuais, inserir os do novo plano).

**6. Rota e sidebar**
Adicionar link "Perfil de Planos" no sidebar ROOT (grupo Plataforma).

### Arquivos

| Arquivo | Ação |
|---|---|
| Migration SQL | Criar `plan_module_templates`, adicionar `brands.subscription_plan` |
| `src/pages/PlanModuleTemplatesPage.tsx` | Nova página ROOT |
| `src/components/consoles/RootSidebar.tsx` | Adicionar link |
| `src/App.tsx` | Adicionar rota |
| `supabase/functions/provision-trial/index.ts` | Usar template do plano "free" |
| `supabase/functions/stripe-webhook/index.ts` | Aplicar template ao ativar plano |

### Regras
- Somente ROOT pode gerenciar templates de planos
- RLS: leitura para authenticated, escrita só root_admin
- Módulos core sempre habilitados independente do plano


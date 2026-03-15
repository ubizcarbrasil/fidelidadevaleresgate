

## Plano: Botão "Aplicar Retroativamente" por Plano

### O que será feito

Adicionar, abaixo da matriz, um grupo de botões (um por plano) que permite ao ROOT aplicar o template de módulos de um plano a **todas as marcas existentes** que possuem aquele `subscription_plan`.

### Mudanças

**1. Edge Function `apply-plan-template/index.ts` (nova)**

Recebe `{ plan_key }`, busca todas as marcas com `subscription_plan = plan_key`, e para cada uma:
- Deleta os `brand_modules` existentes
- Insere os módulos do template correspondente (com core modules sempre habilitados)
- Retorna quantas marcas foram atualizadas

Usa `SUPABASE_SERVICE_ROLE_KEY` para bypass de RLS. Valida que o chamador é `root_admin`.

**2. `src/pages/PlanModuleTemplatesPage.tsx`**

- Adicionar uma seção "Aplicar Retroativamente" com 3 botões (Free, Starter, Profissional)
- Cada botão abre um `AlertDialog` de confirmação informando quantas marcas serão afetadas
- Ao confirmar, invoca a edge function `apply-plan-template`
- Exibe toast com resultado (X marcas atualizadas)

**3. `supabase/config.toml`**

Registrar a nova function com `verify_jwt = false` (validação manual no código).

### Arquivos

| Arquivo | Ação |
|---|---|
| `supabase/functions/apply-plan-template/index.ts` | Criar edge function |
| `src/pages/PlanModuleTemplatesPage.tsx` | Adicionar seção com botões + AlertDialog |


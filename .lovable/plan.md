

# Onde estão os Modelos Contratáveis hoje + Extensão para Cidade

## Resposta direta — onde consultar/contratar HOJE

Os 13 modelos contratáveis (incluindo os 10 que você listou) já estão acessíveis em **2 telas** do painel Raiz:

### 1. Definir preço do modelo (Catálogo)
**Rota:** `/admin/central-modulos` → aba **"Modelos de Negócio"** → sub-aba **"Catálogo"**
- Clique no modelo → modal de edição
- Toggle "Vendável como add-on" (já está ON nos 13)
- Campo "Preço mensal (R$)" e "Preço anual (R$)" — **hoje estão TODOS vazios** (`null` no banco). É preciso preencher.

### 2. Conceder o add-on a uma marca
**Rota:** `/admin/central-modulos` → aba **"Modelos de Negócio"** → sub-aba **"Add-ons Vendidos"**
- Botão **"Conceder Add-on"** abre modal: escolhe Marca + Modelo + Ciclo + Preço
- Hoje há **0 add-ons concedidos** no banco (sistema pronto, ainda não usado)

### 3. Empreendedor vê o resultado
No painel da marca, em "Modelos de Negócio", o modelo aparece com badge **"Add-on"** (azul, distinto do badge "Plano").

## ⚠️ O GAP que você apontou agora

Hoje o add-on é concedido **por MARCA inteira** — uma vez ativo, vale para todas as cidades daquela marca. Você quer poder **atribuir add-on a uma CIDADE específica** (ex: Drivetu compra "Duelo Motorista" só para Aracaju, não para Lagarto). E definir preço diferente por contratação (cidade específica pode ter preço diferente).

Isso é a **Sub-fase 6.2 — Add-ons por Cidade**.

## O que vai ser construído na Sub-fase 6.2

### 1. Banco — 1 coluna nova + ajuste em UNIQUE

**`brand_business_model_addons` ganha:**
- `branch_id UUID NULL` — se preenchido, add-on vale só para essa cidade. Se NULL, vale para a marca inteira (comportamento atual mantido).
- FK para `branches(id) ON DELETE CASCADE`
- Index `(brand_id, branch_id, business_model_id)`
- Substitui o UNIQUE atual `(brand_id, business_model_id)` por UNIQUE `(brand_id, COALESCE(branch_id, '00000000...'), business_model_id)` — permite 1 add-on por escopo (marca-toda OU por cidade).

### 2. RPC `resolve_active_business_models` — atualizada

Hoje retorna add-ons da marca. Vai passar a fazer **UNION**:
- add-ons com `branch_id IS NULL` (valem para tudo)
- add-ons com `branch_id = <cidade-atual>` (valem só para essa cidade)

A RPC `get_branch_active_business_models` (resolução por cidade) também passa a considerar add-ons específicos da branch + overrides da branch.

### 3. UI — 2 mudanças no Raiz

**a) Modal "Conceder Add-on" (existente) ganha 1 campo:**
- Novo campo: **"Escopo"** com 2 opções:
  - "Marca inteira (todas as cidades)" — comportamento atual
  - "Cidade específica" → mostra Select de branches da marca escolhida

**b) Tabela "Add-ons Vendidos" ganha 1 coluna:**
- Nova coluna **"Cidade"** entre Marca e Modelo:
  - Mostra "Todas" (badge cinza) se `branch_id IS NULL`
  - Mostra nome da cidade (badge azul) se `branch_id` preenchido
- Filtro adicional por cidade no header

### 4. UI — 1 mudança no Painel do Empreendedor

Na aba "Modelos por Cidade" (já existe em `/brand-modules` e `/branch-business-models`), o card do modelo ganha badge:
- **"Add-on Marca"** (azul) — se add-on cobre marca inteira
- **"Add-on Cidade"** (verde) — se add-on é exclusivo daquela cidade
- Sem badge — herdado do plano

### 5. Pricing — flexível por contratação

Já é como funciona hoje: o preço do catálogo (`addon_price_monthly_cents`) é só **sugestão**. No modal de concessão, você pode editar o valor real cobrado para aquela contratação específica. Isso continua igual — vale tanto para add-on de marca quanto de cidade.

## Arquivos a editar/criar

| Arquivo | Ação |
|---|---|
| `supabase/migrations/<nova>.sql` | adicionar `branch_id` em `brand_business_model_addons`, ajustar UNIQUE/index, atualizar RPCs `resolve_active_business_models` e `list_business_model_addons` |
| `src/compartilhados/hooks/hook_business_model_addons.ts` | adicionar `branch_id` em `BusinessModelAddonRow` e `GrantAddonInput`; expor branch_label no list |
| `src/features/central_modulos/components/dialog_conceder_addon.tsx` | adicionar Select "Escopo" + Select de cidade condicional |
| `src/features/central_modulos/components/secao_addons_vendidos.tsx` | nova coluna "Cidade" + filtro por cidade |
| `src/features/painel_modelos_negocio/components/card_modelo_brand.tsx` | distinguir badge "Add-on Marca" vs "Add-on Cidade" |
| `src/compartilhados/hooks/hook_brand_plan_business_models.ts` | considerar add-ons de cidade na resolução |
| `src/components/manuais/dados_manuais.ts` | atualizar manual "Add-ons Vendidos" com explicação de escopo |

## Riscos e rollback

- **Compatibilidade:** add-ons existentes (0 hoje) ficam com `branch_id = NULL` → comportamento idêntico. Nenhuma quebra.
- **Rollback:** `ALTER TABLE brand_business_model_addons DROP COLUMN branch_id` + reverter RPCs.

## Estimativa
~20 min. Commit atômico único. `npx tsc --noEmit` esperado limpo.

## Antes de implementar

Preciso de 2 confirmações:

1. **Quando você concede um add-on de "Cidade específica" + a marca já tem o add-on de "Marca inteira" no mesmo modelo** — isso é proibido (UNIQUE bloqueia) ou os dois coexistem (o de cidade sobrescreve preço/data daquela cidade, marca-inteira vale para o resto)?
2. **Preço unitário do modelo:** você quer 1 preço único por modelo (o que está no Catálogo) **OU** preços separados "preço por marca inteira" vs "preço por cidade" (geralmente cidade é mais barato)?


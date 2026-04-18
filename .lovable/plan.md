

## Entendendo o pedido

Você quer um fluxo onde:
1. **Root admin** seleciona uma marca (empreendedor) e habilita/desabilita as funcionalidades que aquela marca pode usar
2. **Empreendedor** (brand admin), dentro do que o root liberou, faz o mesmo para cada cidade franqueada dele

Isso já existe parcialmente no projeto. Vou mapear o que tem e o que falta.

## O que já existe hoje

**Backend (100% pronto):**
- `module_definitions` — catálogo de funcionalidades com flag `is_core` e `customer_facing`
- `brand_modules` — toggle por marca (escopo root)
- `city_module_overrides` — override por cidade (escopo empreendedor)
- RPC `resolve_active_modules` — cascata cidade > marca > is_core
- Hook `useResolvedModules` com Realtime

**UI Root (`/admin/central-modulos`):**
- Aba "Empreendedores": lista marcas e permite ligar/desligar módulos por marca (escreve em `brand_modules`)
- Aba "Cidades": dentro de cada marca, lista cidades e permite override (escreve em `city_module_overrides`)

**O problema real:** essa tela existe e funciona, mas ela é **Root-only**. O empreendedor não tem acesso equivalente para gerenciar as cidades dele dentro do que o root liberou.

## O que falta (o gap)

Uma versão da aba "Cidades" acessível ao **empreendedor (BRAND_ADMIN)**, dentro do painel da marca, que:
- Liste apenas as cidades da marca dele (já isolado por `useBrandGuard`)
- Mostre apenas os módulos que o **root liberou para essa marca** (filtrar por `brand_modules.is_enabled = true`)
- Permita o empreendedor fazer override por cidade (mesma lógica de cyclar inherit → override_on → override_off → inherit)
- Não deixe o empreendedor ligar módulos que o root desligou (gate visual + RLS)

## Plano de execução

### 1. Nova página: `/configuracao-cidades` (escopo empreendedor)
Arquivo: `src/features/configuracao_cidades/pagina_configuracao_cidades.tsx`

Reaproveita 100% a lógica das abas "Cidades" do root, mas:
- Usa `useBrandGuard` para travar `brandId` automaticamente (sem seletor de marca)
- Esconde módulos onde `brand_modules.is_enabled = false` (esses ficam invisíveis pro empreendedor)
- Desabilita visualmente módulos `is_core = true` (não pode ser desligado nunca)

### 2. Hook reaproveitado
`useCityModulesOverview` já filtra pelos módulos ativos da marca (linha 47-54 de `hook_city_overrides.ts`). **Está pronto.** Só preciso reusar.

`useCycleOverrideState` e `useClearAllOverrides` também já existem e são reaproveitáveis.

### 3. Componentes reutilizáveis
Quebrar o conteúdo atual de `aba_cidades.tsx` (Root) em:
- `compartilhados/components/seletor_cidade.tsx` — dropdown de cidades
- `compartilhados/components/tabela_modulos_cidade.tsx` — tabela com 3 estados (herda/on/off)

Tanto a aba Root quanto a nova página do empreendedor consomem esses componentes. Zero duplicação.

### 4. Menu lateral
Adicionar item no `BrandSidebar.tsx` no grupo "Cidades":
- Label: "Configuração por Cidade"
- Icon: `Settings2`
- Rota: `/configuracao-cidades`
- Visível só para `BRAND_ADMIN` (não para `BRANCH_ADMIN`, que é franqueado e não deve mexer em outras cidades)

### 5. RLS — proteção dupla
Verificar políticas em `city_module_overrides` para garantir que:
- BRAND_ADMIN só pode INSERT/UPDATE/DELETE em cidades da própria marca
- BRAND_ADMIN não consegue criar override para módulo onde `brand_modules.is_enabled = false` (validação via trigger ou check policy)

### 6. Rota e guard
Em `App.tsx`: adicionar rota protegida por `BrandGuard` (já existente). Sem `ModuleGuard` porque é uma página de configuração estrutural.

## Resumo do que muda

| Arquivo | Ação |
|---|---|
| `src/features/configuracao_cidades/pagina_configuracao_cidades.tsx` | CRIAR |
| `src/compartilhados/components/seletor_cidade.tsx` | CRIAR (extrair de aba_cidades) |
| `src/compartilhados/components/tabela_modulos_cidade.tsx` | CRIAR (extrair de aba_cidades) |
| `src/features/central_modulos/components/aba_cidades.tsx` | REFATORAR para usar os novos compartilhados |
| `src/components/consoles/BrandSidebar.tsx` | ADICIONAR item de menu |
| `src/App.tsx` | ADICIONAR rota |
| Migration RLS em `city_module_overrides` | VALIDAR/AJUSTAR policies |

Estimativa: 1 commit, ~350 linhas, 7 arquivos tocados.

## Perguntas antes de executar

Preciso confirmar 2 decisões antes de codar:

1. **Sobre o root habilitar coisas para o empreendedor**: a tela `/admin/central-modulos` aba "Empreendedores" **já faz isso hoje** (root liga/desliga módulos por marca). Você quer que eu apenas confirme que está funcionando, ou tem alguma melhoria específica em mente nessa tela também?

2. **Sobre o BRANCH_ADMIN (franqueado da cidade)**: ele deve ter acesso a essa nova tela `/configuracao-cidades` para mexer **só na cidade dele**, ou apenas o BRAND_ADMIN (dono da marca) configura tudo?




# Remover "Regras de Resgate" do menu Cidades

## Diagnóstico

O item **Regras de Resgate** no grupo "Cidades" do sidebar tem dois problemas:

1. **Não abre quando clicado** — A rota `/regras-resgate` em `src/App.tsx` (linha 249) está protegida por `<ModuleGuard moduleKey="affiliate_deals">`, mas o item do menu (`src/compartilhados/constants/constantes_menu_sidebar.ts` linha 79) declara `moduleKey: "redemption_rules"`. Resultado: para marcas como **Drive Engajamento** (Premium Motorista), que **não** tem `affiliate_deals` ativo, o guard bloqueia o conteúdo e a tela fica em branco.

2. **É redundante** — Tudo o que essa página faz (taxa de conversão pts/R$, mínimo de pontos, limite mensal, prazo de aprovação, modelo de negócio) já está disponível **dentro do formulário de cada cidade** (`BrandBranchForm.tsx`, "Card 1 — Regra de Resgate"), com a vantagem de ser configurável por cidade. A página global virou um vestígio anterior à arquitetura por cidade.

## Ajuste

### 1. Remover o item do sidebar
Arquivo: `src/components/consoles/BrandSidebar.tsx` (linha 55)

Remover `"sidebar.regras_resgate"` da lista de items do grupo "Cidades". Ficará:

```ts
items: [
  { key: "sidebar.branches", overrides: { defaultTitle: "Minhas Cidades", url: "/brand-branches" } },
  "sidebar.pacotes_pontos",
  "sidebar.jornada_cidades", "sidebar.onboarding_cidade", "sidebar.configuracao_cidade",
  "sidebar.configuracao_modulos_cidade",
  ...
]
```

### 2. Remover do guard de duplicações
Arquivo: `src/compartilhados/hooks/hook_duplicacoes_menu.ts` (linha 81)

Remover `{ key: "sidebar.regras_resgate" }` do grupo "Cidades" para o detector de duplicatas não reclamar.

### 3. Remover do quick links do dashboard
Arquivo: `src/components/dashboard/DashboardQuickLinks.tsx` (linha 110)

Remover o atalho `Regras de Resgate` do dashboard, já que a tela vai sumir do menu.

## O que **vou manter**

- ✅ A rota `/regras-resgate` em `App.tsx` (não removo para não quebrar links antigos salvos por usuários — quem acessar direto pela URL ainda vê)
- ✅ O arquivo `RegrasResgatePage.tsx` (mesma razão)
- ✅ A entrada `"sidebar.regras_resgate"` no registry (`constantes_menu_sidebar.ts`) — fica disponível caso alguém precise religar no futuro, só não vai mais ser referenciada pelo sidebar
- ✅ O hook `useRegrasResgateCidade` e toda a lógica de resolução de regras por cidade — continuam sendo usados pelos modais de produtos
- ✅ O label em `useMenuLabels.ts` — para o caso de a entrada voltar ao menu
- ✅ Conteúdo de manuais e jornada que mencionam "Regras de Resgate" — viram referência histórica/contextual, não quebram nada

## O que NÃO vou mexer

- ❌ Banco, RLS, edge functions, RPCs
- ❌ Form da cidade (`BrandBranchForm.tsx`) — continua sendo o lugar oficial dessas configurações
- ❌ Modais de produtos que consomem `useRegrasResgateCidade`
- ❌ Outros itens do menu Cidades

## Resultado esperado

- O item **Regras de Resgate** desaparece do menu lateral do empreendedor (no grupo "Cidades")
- Desaparece também do bloco de atalhos rápidos do dashboard
- Não há mais clique que "não abre"
- Configurações de regras de resgate continuam disponíveis abrindo cada cidade individualmente em **Cidades → Minhas Cidades → Editar**

## Risco

Zero. É remoção de 3 referências em arquivos de configuração de menu. `npx tsc --noEmit` esperado limpo.

## Estimativa

~1 min.


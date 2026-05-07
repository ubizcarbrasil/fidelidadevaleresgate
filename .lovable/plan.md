## Problema

A vitrine `/ofertas` (Ubiz Ofertas) hoje não replica o padrão do Achadinhos: não há uma **seção por categoria** com carrossel lateral próprio e botão **"Ver todos"** dentro da seção. Quando o usuário seleciona uma categoria pelo grid de pílulas, ela só filtra as listas globais (Destaque/Novas/Todas), em vez de focar a seção daquela categoria como acontece nos Achadinhos.

## Objetivo

Reproduzir, na página Ubiz Ofertas, o mesmo comportamento dos Achadinhos:
- Renderizar **uma seção horizontal por categoria** (com cabeçalho, ícone, cor e contagem).
- Cada seção tem **carrossel lateral** próprio com snap.
- Cada seção tem **"Ver todos"** que filtra a página para mostrar somente aquela categoria.
- Ao selecionar uma categoria (no grid de pílulas ou via "Ver todos"), apenas a seção dessa categoria aparece, com a grade completa abaixo (paginada).
- Botão **"Mostrar todas as categorias"** quando filtrado, para limpar o filtro.

## Mudanças

### 1. Novo componente `secoes_por_categoria.tsx`
`src/features/ubiz_ofertas/components/secoes_por_categoria.tsx`

Renderiza, para cada categoria com ofertas suficientes (mínimo 3, igual Achadinhos):
- Cabeçalho com ícone colorido + nome + contagem.
- Botão "Ver todos" → chama `onSelecionarCategoria(cat.id)`.
- Carrossel horizontal com `scroll-snap-type: x mandatory` mostrando até 12 cards da categoria.
- Reutiliza `CardOferta` existente.

Props: `categorias`, `ofertas`, `fontHeading`, `onClickOferta`, `onSelecionarCategoria`.

### 2. Atualizar `pagina_ubiz_ofertas.tsx`

Reorganizar o fluxo de renderização:

```text
[Cabeçalho]
[Banner]
[Grade Categorias (pílulas + Todos)]

SE categoria NÃO selecionada:
  [Em Destaque - carrossel]
  [Novas Ofertas - carrossel]
  [Seções por Categoria - uma por categoria com Ver todos]
  [Todas as ofertas - grade paginada]

SE categoria selecionada:
  [Cabeçalho da categoria + botão "Mostrar todas"]
  [Grade Todas as Ofertas filtrada e paginada]
```

- Ao clicar "Ver todos" de uma seção, atualiza `?categoria=<id>` no URL (já existe a infra).
- Ao clicar "Todos" no grid de pílulas (ou no botão "Mostrar todas"), limpa o param.

### 3. Lógica de filtragem por categoria

- Mínimo de 3 ofertas por categoria para criar a seção (mesmo critério do Achadinhos), evitando seções vazias.
- Categorias renderizadas seguem a ordem de `order_index` já vinda do backend.
- Em `secoes_por_categoria.tsx`, agrupar `ofertas` por `category_id` em memo para performance.

## Arquivos afetados

- **criado**: `src/features/ubiz_ofertas/components/secoes_por_categoria.tsx`
- **editado**: `src/features/ubiz_ofertas/pagina_ubiz_ofertas.tsx`

## Resultado esperado

Quando o usuário entra em `/ofertas`:
- Vê pílulas de categorias no topo.
- Logo abaixo, **uma seção horizontal por categoria** (estilo Achadinhos), com "Ver todos" próprio.
- Pode rolar lateralmente os cards dentro de cada seção sem afetar as outras.
- Ao tocar "Ver todos" ou em uma pílula, a página foca apenas naquela categoria, mostrando a grade completa paginada.

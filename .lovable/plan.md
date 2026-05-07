## Objetivo

Permitir que a vitrine pública `Ubiz Ofertas` filtre as ofertas por categoria diretamente na própria página (como nos Achadinhos), em vez de abrir uma tela separada (`DriverCategoryPage`) ao clicar numa categoria.

## Comportamento atual

- `src/features/ubiz_ofertas/pagina_ubiz_ofertas.tsx` mostra `GradeCategoriasOfertas`.
- Ao clicar numa categoria, abre overlay `DriverCategoryPage` com a lista daquela categoria.
- As seções "Em Destaque", "Novas Ofertas" e "Todas as ofertas" sempre mostram tudo.

## Comportamento desejado

Igual aos Achadinhos (`DriverMarketplace` + `DriverCategoryCarousel`):

- Um carrossel/grid de categorias com botão "Todos" no início.
- Ao selecionar uma categoria, as seções da página são filtradas inline por `category_id`.
- Ao clicar em "Todos", volta a mostrar todas as ofertas.
- Não abre mais a tela separada de categoria.

## Mudanças

1. `src/features/ubiz_ofertas/pagina_ubiz_ofertas.tsx`
   - Adicionar estado `categoriaSelecionadaId: string | null`.
   - Aplicar filtro por `category_id` em `ofertas`, `novasOfertas` e `ofertasDestaque` antes de renderizar `VitrineOfertas`.
   - Remover a abertura de `DriverCategoryPage` (o overlay e o estado `categoriaAberta`).
   - Passar `categoriaSelecionadaId` e `onSelecionar` para `GradeCategoriasOfertas`.

2. `src/features/ubiz_ofertas/components/grade_categorias_ofertas.tsx`
   - Receber `selecionadaId: string | null` e callback `onSelecionar(id: string | null)`.
   - Adicionar um item "Todos" no começo (ícone `LayoutGrid`) que limpa o filtro.
   - Aplicar destaque visual no item selecionado (igual ao `DriverCategoryCarousel`: cor cheia + sombra leve quando ativo).
   - Manter scroll horizontal e o mesmo padrão visual.

3. Sem mudanças em backend, configuração ou banco. Nenhuma quebra na configuração existente em `secao_configuracao_ofertas.tsx`.

## Como ativar (resposta para o usuário)

Não há nada novo para ativar — a vitrine continua sendo controlada pelo toggle "Ativar vitrine pública Ubiz Ofertas" em **Achadinhos → Ubiz Ofertas**. Após esta atualização, o filtro por categoria passa a funcionar automaticamente na página `/ofertas`, exatamente como nos Achadinhos.

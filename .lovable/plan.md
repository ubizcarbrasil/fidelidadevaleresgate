
Diagnóstico

Eu verifiquei o código e o problema não é mais o gesto de toque. No `DriverMarketplace`, o `touchAction: "pan-x"` já está aplicado nos containers horizontais.

A causa real é outra:
- o painel do motorista está com `driver_category_layout` configurado com `rows: 2` para as categorias
- quando `configuredRows > 1`, o componente NÃO renderiza um carrossel
- ele cai neste bloco:
  `className="px-5 grid grid-cols-2 gap-3 pb-1"`
- isso vira uma grade estática de 2 colunas, então não existe nada para “rolar para o lado”

Ou seja: o app está mostrando grade, não carrossel.

Plano de correção

1. Ajustar o modo multi-linha no `src/components/driver/DriverMarketplace.tsx`
- trocar o branch `configuredRows > 1` de grade estática por uma grade horizontal rolável
- seguir o mesmo padrão já usado no app do cliente em `HomeSectionsRenderer`:
  - `overflow-x-auto`
  - `display: grid`
  - `gridTemplateRows: repeat(configuredRows, 1fr)`
  - `gridAutoFlow: column`
  - `gridAutoColumns` com largura fixa de card
  - `scrollSnapType: "x mandatory"`
  - `touchAction: "pan-x"`

2. Manter o comportamento atual de 1 linha
- quando `configuredRows === 1`, continua usando o carrossel horizontal atual com `DriverDealCard`

3. Preservar a lógica de “Ver todos”
- continuar limitando a prévia por categoria
- manter o overlay “Ver todos” igual está hoje

4. Garantir tamanho consistente dos cards no modo de 2+ linhas
- usar largura fixa por coluna para que a grade realmente deslize horizontalmente
- se necessário, ajustar o wrapper do `DriverDealCardGrid` para funcionar bem dentro do grid horizontal

5. Validar o resultado esperado
- com `rows = 2`, a seção deve continuar em 2 linhas, mas agora deslizando para o lado
- com `rows = 1`, deve continuar como carrossel tradicional
- “Outras ofertas” e categorias com 1 linha não mudam

Arquivos envolvidos
- `src/components/driver/DriverMarketplace.tsx`
- possivelmente `src/components/driver/DriverDealCardGrid.tsx` se precisar fixar largura no modo multi-linha

Detalhe importante
Hoje existe um workaround administrativo: se na configuração do painel do motorista você colocar `Linhas = 1`, o carrossel lateral volta. Mas o ajuste correto é implementar o modo `2+ linhas` como carrossel horizontal em grade, igual ao padrão do app do cliente.

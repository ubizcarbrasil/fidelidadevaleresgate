
Objetivo

Corrigir o Achadinhos do painel do motorista para que, quando a categoria estiver configurada com 2+ linhas, cada linha role horizontalmente de forma independente — e não mais como um bloco único.

Diagnóstico confirmado

O comportamento atual é esperado pelo código existente:
- em `src/components/driver/DriverMarketplace.tsx`, o modo `configuredRows > 1` usa um único container com:
  - `overflow-x-auto`
  - `display: grid`
  - `gridAutoFlow: "column"`
- essa estrutura cria um único eixo de rolagem para todas as linhas
- por isso, ao arrastar, o conjunto inteiro anda junto

Ajuste correto

1. Refatorar o modo multi-linha em `src/components/driver/DriverMarketplace.tsx`
- remover o grid horizontal único do bloco `configuredRows > 1`
- substituir por várias linhas empilhadas
- cada linha terá seu próprio container horizontal

2. Distribuir os cards por linha
- usar os `visibleDeals` já calculados
- separar os itens em arrays independentes, um para cada linha
- manter ordem previsível visualmente, preenchendo por linha

Exemplo com 2 linhas:
```text
linha 1: item 1, item 2, item 3
linha 2: item 4, item 5, item 6
```

3. Criar um carrossel por linha
- cada linha vai usar:
  - `flex`
  - `gap-3`
  - `overflow-x-auto`
  - `scrollSnapType: "x mandatory"`
  - `touchAction: "pan-x"`
  - padding lateral igual ao restante da tela
- assim cada linha responde ao gesto separadamente

4. Reaproveitar `DriverDealCardGrid`
- manter o componente atual dos cards
- preservar `scrollSnapAlign: "start"`
- manter o mesmo visual de card, badge, preço e clique externo

5. Não mexer no restante do fluxo
- `configuredRows === 1` continua como está hoje
- busca continua em grid estático
- overlay “Ver todos” continua como está
- “Outras ofertas” continua no carrossel atual

Arquivos envolvidos
- `src/components/driver/DriverMarketplace.tsx`
- possivelmente sem necessidade de alterar `src/components/driver/DriverDealCardGrid.tsx` além do que já existe

Resultado esperado
- cada linha de Achadinhos vai deslizar sozinha
- ao arrastar a linha de cima, a de baixo não acompanha
- deixa de existir o efeito de “rolar o bloco todo”

Detalhe técnico
O problema não é mais snap, padding ou largura. O problema é estrutural: um único `overflow-x-auto` nunca permite rolagem independente por linha. Para entregar o comportamento que você quer, o modo multi-linha precisa ser transformado em múltiplos carrosseis horizontais, um por linha.

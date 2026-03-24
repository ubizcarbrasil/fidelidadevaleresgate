
Objetivo corrigido: a vitrine principal de Achadinhos não deve “abrir tudo para baixo”. Ela deve continuar com categorias empilhadas verticalmente, mas cada categoria precisa ter sua própria linha com rolagem horizontal para ver mais produtos sem depender de “Ver todos”.

### Causa do problema
Nas últimas alterações, a listagem principal foi convertida para grid:
- `src/components/customer/AchadinhoSection.tsx` usa grid na home (`grid grid-cols-2`) e ainda troca para uma view vertical completa quando a categoria é selecionada.
- `src/components/driver/DriverMarketplace.tsx` usa grid (`grid grid-cols-3`) dentro de cada categoria.

Isso contraria o padrão que você descreveu: navegar lateralmente dentro de cada linha da categoria.

### O que vou ajustar

#### 1) Restaurar o comportamento horizontal por categoria na home do cliente
**Arquivo:** `src/components/customer/AchadinhoSection.tsx`

- Remover a lógica que troca a home para grid vertical quando `selectedCat` é escolhido.
- Manter a home sempre agrupada por categoria.
- Trocar cada bloco de ofertas da categoria para um carrossel horizontal:
  - container com `flex gap-3 overflow-x-auto scrollbar-hide`
  - `scrollSnapType: "x mandatory"`
  - `touchAction: "pan-x pan-y"`
- Reusar os cards em modo carrossel (`isCarousel`) para os itens ficarem em sequência lateral.
- O clique na pill da categoria deixará de “abrir tudo para baixo”:
  - vai apenas destacar a categoria e rolar até a seção correspondente, ou filtrar visualmente só a seção sem mudar o layout para grid vertical.
- O botão **“Ver todos”** continua existindo para abrir a página completa da categoria.

#### 2) Restaurar o comportamento horizontal por categoria no painel do motorista
**Arquivo:** `src/components/driver/DriverMarketplace.tsx`

- Substituir o grid atual de cada categoria (`grid grid-cols-3`) por uma linha horizontal com scroll lateral.
- Usar `DriverDealCard` em vez de `DriverDealCardGrid` nas seções da home.
- Remover o corte visual baseado em linhas cheias na home principal, porque agora o usuário verá todos os deals deslizando para o lado.
- Manter a página “Ver todos” como visão completa da categoria.

#### 3) Preservar a ordem correta definida no admin
**Arquivos:**  
- `src/components/customer/AchadinhoSection.tsx`
- `src/components/driver/DriverMarketplace.tsx`

A ordenação por `brand_settings_json.driver_category_layout.order` já existe e será mantida. A correção aqui é não quebrar isso ao refatorar a renderização.

#### 4) Garantir gesto mobile correto
**Arquivos afetados pelos containers horizontais**
- adicionar `touchAction: "pan-x pan-y"` onde houver rolagem lateral:
  - pills de categorias
  - linhas horizontais de deals
  - blocos “Outras ofertas”

Isso é importante para permitir:
- rolar horizontalmente a linha da categoria
- continuar conseguindo subir/descer a página quando o toque começa em cima do card

### O que não vou mudar
- Não vou alterar a categorização dos produtos.
- Não vou mexer na página completa da categoria (`Ver todos`), porque ela continua útil como visão detalhada.
- Não há necessidade de mudança no banco.

### Resultado esperado
Na tela principal:
- cada categoria aparece uma abaixo da outra;
- cada categoria tem **uma linha horizontal própria**;
- o usuário arrasta **para o lado** para ver mais ofertas daquela categoria;
- a home não fica gigante com todos os produtos abertos;
- a ordem das categorias continua seguindo o admin.

### Detalhes técnicos
Implementação esperada:
- `AchadinhoSection.tsx`
  - remover branch `selectedCat ? <grid vertical> : ...`
  - usar refs por categoria para scroll até seção
  - converter cada seção para `flex overflow-x-auto`
- `DriverMarketplace.tsx`
  - trocar `DriverDealCardGrid` por `DriverDealCard` nas seções principais
  - remover `visibleDeals.slice(...)` na home principal
  - cada seção vira uma faixa horizontal independente

### Validação depois da implementação
Vou considerar concluído quando, no celular:
1. cada categoria puder ser rolada lateralmente;
2. os produtos extras apareçam sem precisar abrir “Ver todos”;
3. a página principal não cresça com todos os produtos empilhados;
4. a ordem das categorias siga exatamente o padrão do admin;
5. a rolagem vertical da página continue fluida mesmo começando o gesto sobre um card.

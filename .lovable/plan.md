

## Plano: Mover indicadores de dots para fora do banner

### Problema
Os dots indicadores do carrossel de banners ficam **dentro** da imagem (overlay), junto com um gradiente escuro. O usuário quer removê-los de dentro do banner e colocá-los **abaixo** da imagem, como pontos separados.

### Alterações

**Arquivo**: `src/components/HomeSectionsRenderer.tsx` (função `BannerCarousel`, linhas 978-1005)

1. Remover o overlay gradiente escuro (linha 985: `bg-gradient-to-t from-black/20`)
2. Mover os dots para **fora** do `div` do banner (após o `rounded-2xl`), posicionados abaixo como elementos normais (não `absolute`)
3. Dots ficam centralizados, com estilo de bolinhas redondas (círculos iguais, cor primária para ativo, cinza para inativo)

**Arquivo**: `src/components/driver/DriverBannerCarousel.tsx` (linhas 55-83)

1. Mesma lógica: mover dots para fora do container da imagem, abaixo do banner
2. Remover posicionamento `absolute` dos dots

### Resultado
- Banner fica limpo, sem overlay ou dots por cima da imagem
- Dots aparecem abaixo do banner como indicadores circulares centralizados


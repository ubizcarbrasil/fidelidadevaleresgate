

## Plano: Alinhar visual do painel do motorista com o app do cliente

### Problema
O painel do motorista (`DriverMarketplace`) não está com o mesmo visual do app do cliente. Pela screenshot, o banner ocupa quase toda a tela e o estilo geral não bate com o app do passageiro.

### O que será feito

Ajustar o `DriverMarketplace` para ter a mesma estética do `CustomerLayout`:

**1. Ativar dark mode no painel do motorista**
- Na página `DriverPanelPage.tsx`, adicionar `useEffect` que ativa `dark` class no `documentElement` (igual ao `CustomerLayout`)

**2. Header idêntico ao do cliente**
- Mesmo padding, mesmo estilo de logo + título (font-extrabold, 15px)
- Busca com mesmo estilo: botão com fundo `muted`, ícone + placeholder "O que está procurando?"
- Remover a busca com `<Input>` e usar o mesmo estilo de botão do cliente

**3. Banner do topo com altura correta**
- O `aspect-[21/9]` já está correto mas o container pode estar inflando. Adicionar `max-h-[200px]` como fallback para garantir que não fique gigante

**4. Manter tudo que já funciona**
- Carrossel de categorias
- Seções de produtos com linhas configuráveis
- Banners intercalados
- Busca funcional (abrir overlay ou filtrar inline)

### Arquivos envolvidos
- **Editar**: `src/components/driver/DriverMarketplace.tsx` — header e busca no estilo do cliente
- **Editar**: `src/pages/DriverPanelPage.tsx` — ativar dark mode
- **Editar**: `src/components/driver/DriverBannerCarousel.tsx` — garantir altura máxima no banner




## Plano: Adicionar banners ao painel do motorista + toggle na config

### O que será feito

1. **Adicionar carrossel de banners no `DriverMarketplace.tsx`**
   - Buscar banners da tabela `banner_schedules` (mesma fonte do app do cliente)
   - Renderizar carrossel horizontal auto-scroll acima das seções de categorias
   - Respeitar filtro de `brand_id` e datas ativas

2. **Adicionar carrossel de ícones de categoria no topo** (como na screenshot do Achadinhos)
   - Mostrar círculos coloridos com ícones das categorias
   - Botão "Todos" selecionado por padrão
   - Ao clicar em categoria, filtra as seções abaixo (scroll para seção ou destaque)

3. **Remover do driver**: saudação, pontos, seletor de cidade, sino, carteira (já está sem esses itens)

4. **Adicionar toggle de banners no `DriverPanelConfigPage.tsx`**
   - Switch "Exibir banners" que salva no `brand_settings_json` do brand (campo `driver_show_banners`)
   - O `DriverMarketplace` verifica essa config antes de renderizar banners

### Arquivos envolvidos
- **Editar**: `src/components/driver/DriverMarketplace.tsx` — adicionar banners + carrossel de categorias no topo
- **Editar**: `src/pages/DriverPanelConfigPage.tsx` — adicionar toggle de banners

### Detalhes técnicos

**Banners no DriverMarketplace:**
- Query: `banner_schedules` filtrado por `brand_id`, `is_active=true`, `start_at <= now`, sem `end_at` expirado
- Carrossel simples com auto-scroll (CSS scroll-snap)
- Controlado por flag `driver_show_banners` em `brand_settings_json`

**Carrossel de categorias:**
- Reutilizar o mesmo visual do `AchadinhoSection` (círculos coloridos com ícones Lucide)
- Botão "Todos" + cada categoria com deals
- Ao clicar, faz scroll suave até a seção da categoria

**Toggle na config:**
- Usa mutation para atualizar `brands.brand_settings_json` com `{ ...existing, driver_show_banners: true/false }`


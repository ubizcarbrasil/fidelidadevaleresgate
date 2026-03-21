

## Plano: Banners intercalados entre seções de categorias no Driver Panel

### O que será feito

1. **Permitir inserir banners entre seções de categorias** no marketplace do motorista
2. **Gerenciar banners dedicados ao driver** na página de configuração (`DriverPanelConfigPage`)
3. **Usar o mesmo aspect ratio / altura** dos banners do app do cliente (Achadinhos)

### Como funciona

Cada banner no `banner_schedules` já possui um campo `brand_section_id` (para vincular a uma seção) e `order_index`. Para o driver, usaremos uma abordagem similar: o admin associa um banner a uma **posição entre categorias** via `driver_category_layout`.

No `brand_settings_json`, adicionaremos um campo `driver_interstitial_banners`:
```json
{
  "driver_interstitial_banners": [
    { "after_category_id": "<cat-id>", "banner_id": "<banner-id>" },
    { "after_category_id": "__top__", "banner_id": "<banner-id>" }
  ]
}
```

Alternativamente (mais simples e reutilizável): os banners criados diretamente na config do driver são salvos em `banner_schedules` com um campo de metadata indicando que são do driver. Usaremos o campo `link_type = "driver"` como filtro, ou simplesmente buscaremos todos os banners do brand e permitiremos posicioná-los.

**Abordagem escolhida**: Usar a mesma tabela `banner_schedules` com criação inline na config do driver. A posição (entre qual categoria) é salva no `brand_settings_json.driver_banner_positions`.

### Implementação

**1. `src/pages/DriverPanelConfigPage.tsx`**
- Adicionar seção "Banners entre seções" abaixo do toggle de banners do topo
- Listar banners existentes do brand (de `banner_schedules`)
- Botão "Adicionar Banner" que abre dialog com:
  - Upload de imagem (usando `ImageUploadField`, aspect ratio 21:9 — mesmo do cliente)
  - Título opcional
  - Link opcional
  - Seletor "Posicionar após categoria" (dropdown com categorias + opção "Topo")
  - Datas início/fim
- Cada banner na lista mostra: preview, posição, toggle ativo/inativo, botão excluir
- Salvar `driver_banner_positions` no `brand_settings_json`: mapa `{ [banner_id]: { after_category: "<cat-id>" | "__top__" } }`

**2. `src/components/driver/DriverMarketplace.tsx`**
- Buscar banners e suas posições do `brand_settings_json.driver_banner_positions`
- Na renderização das seções de categorias, intercalar banners:
  - Banners com `after_category = "__top__"` → renderizar antes da primeira categoria (após o carrossel de categorias)
  - Banners com `after_category = "<cat-id>"` → renderizar logo após a seção daquela categoria
- Banner usa `aspect-[21/9]` e `rounded-2xl` — mesmo visual do banner do app do cliente
- Altura consistente com a da Central de Banners existente

**3. `src/components/driver/DriverBannerCarousel.tsx`**
- Sem mudanças — este continua sendo o carrossel do topo (controlado pelo toggle existente)

### Arquivos envolvidos
- **Editar**: `src/pages/DriverPanelConfigPage.tsx` — adicionar seção de criação/gestão de banners intercalados + dialog de criação
- **Editar**: `src/components/driver/DriverMarketplace.tsx` — renderizar banners entre seções baseado na config

### Resultado
O empreendedor pode criar banners na aba de configuração do driver, escolher após qual categoria cada banner aparece, e os motoristas veem banners intercalados entre as seções de produtos — com o mesmo tamanho visual dos banners do app do cliente.


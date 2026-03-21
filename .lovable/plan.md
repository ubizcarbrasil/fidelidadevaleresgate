

## Plano: Configurar linhas e ordem por categoria no Painel do Motorista

### O que será feito

Adicionar na página de configuração (`DriverPanelConfigPage`) controles para cada categoria:
- **Quantidade de linhas** (1-5): quantas fileiras horizontais de produtos a seção exibe antes do "Ver todos"
- **Ordem de exibição**: campo numérico ou drag-and-drop para definir a posição da categoria

O marketplace do motorista (`DriverMarketplace`) passará a respeitar essas configurações.

### Onde armazenar

No `brand_settings_json` do brand, campo `driver_category_layout`:
```json
{
  "driver_category_layout": {
    "<category_id>": { "rows": 2, "order": 0 },
    "<category_id>": { "rows": 1, "order": 1 }
  }
}
```

Sem migração de banco — usa o JSON flexível já existente.

### Arquivos envolvidos

**1. `src/pages/DriverPanelConfigPage.tsx`**
- Adicionar na lista de categorias: campo numérico "Linhas" (1-5) e campo numérico "Ordem"
- Botões +/- para ajustar linhas
- Input numérico para ordem
- Mutation que salva no `brand_settings_json.driver_category_layout`

**2. `src/components/driver/DriverMarketplace.tsx`**
- Ler `driver_category_layout` do `brand_settings_json`
- Ordenar categorias pelo `order` configurado (fallback: `order_index` original)
- Limitar deals exibidos por categoria: `rows * itemsPerRow` (itemsPerRow calculado pelo viewport, ~2 cards por linha no mobile)
- "Ver todos" aparece quando há mais deals que o limite

### Lógica de linhas no marketplace

Cada "linha" = 1 row horizontal de scroll com ~2-3 cards visíveis. Com múltiplas linhas, a seção mostra um grid de N linhas × cards ao invés de scroll horizontal único. Exemplo:
- 1 linha = carrossel horizontal (comportamento atual)
- 2+ linhas = grid com N linhas, cada uma scrollável ou grid estático cortado

### Detalhes técnicos

- Padrão se não configurado: 1 linha, ordem = `order_index` da tabela
- Máximo 5 linhas por categoria
- A ordem na config sobrescreve o `order_index` do banco apenas para o driver


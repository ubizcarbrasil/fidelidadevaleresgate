

## Diagnóstico

### 1. Onde está a configuração de categorias
A **Taxonomia** (Categorias e Segmentos) está acessível em:
- **Root Admin**: Sidebar → "Taxonomia" (`/taxonomy`)
- **Empreendedor (Brand)**: Sidebar → Integrações → "Taxonomia" (requer módulo `taxonomy` ativo)

### 2. Por que os ícones das categorias não aparecem no app do cliente
O `SegmentNavSection` filtra lojas com `.not("taxonomy_segment_id", "is", null)`. As **lojas demo não têm `taxonomy_segment_id` preenchido** — o seed atual insere apenas o campo texto `segment` (ex: "Pizzaria"), sem vincular ao ID do segmento na taxonomia. Resultado: zero lojas passam no filtro → seção de categorias não renderiza.

### 3. Seed atual é insuficiente
- Apenas ~48 lojas demo, sem vínculo à taxonomia
- Sem seções CMS temáticas ("Deu fome?", "Saúde e beleza", etc.)
- Sem achadinhos/affiliate deals de teste
- O app fica "vazio" visualmente no primeiro acesso

---

## Plano

### Parte 1: Vincular lojas demo à taxonomia (corrige ícones)

**`supabase/functions/seed-demo-stores/index.ts`**

Após criar cada loja, buscar o segmento na tabela `taxonomy_segments` pelo nome e fazer `UPDATE` do `taxonomy_segment_id` na loja. Criar um mapa de segmento→ID no início da função para evitar queries repetidas.

```
// Pseudo-código
const segmentMap = await fetchAll taxonomy_segments → Map<name, id>
// Na criação de cada store:
store.taxonomy_segment_id = segmentMap.get(demo.segment) || null
```

### Parte 2: Expandir para 60 lojas com ofertas realistas

Adicionar ~12 lojas novas ao array `DEMO_STORES`, cobrindo segmentos que faltam e garantindo diversidade de categorias. Cada nova loja terá pelo menos 1 oferta de loja toda + 1 oferta de produto com foto Unsplash e valor realista.

Novas lojas sugeridas:
| Nome | Segmento | Tipo |
|---|---|---|
| Studio Pilates Corpo Livre | Pilates | RECEPTORA |
| Relojoaria Tempo & Arte | Relojoaria | RECEPTORA |
| Nail Designer | Nail Designer | RECEPTORA |
| Moto Center Speed | Moto Peças | RECEPTORA |
| Casa dos Parafusos | Ferragens | RECEPTORA |
| Empório Natural | Loja de Produtos Naturais | MISTA |
| Chácara Sabor do Campo | Hortifruti | EMISSORA |
| Elétrica Boa Luz | Material Elétrico | RECEPTORA |
| Joias & Prata | Joalheria | RECEPTORA |
| Estacionamento Seguro | Estacionamento | EMISSORA |
| Gráfica Express | Gráfica | RECEPTORA |
| Costura & Estilo | Ateliê de Costura | RECEPTORA |

### Parte 3: Seções CMS temáticas

**`supabase/functions/seed-demo-stores/index.ts`** — Após criar lojas, inserir `brand_sections` + `brand_section_sources` com filtro por segmento:

| Seção | Template | Filtro de segmentos |
|---|---|---|
| "Deu fome? Troque por pontos" | Carrossel de Ofertas | Alimentação (category_id) |
| "Saúde e Beleza" | Grade de Lojas | Saúde + Beleza (category_ids) |
| "Resgate serviços" | Carrossel de Ofertas | Serviços + Automotivo |
| "Moda e Acessórios" | Grade de Lojas | Moda e Acessórios |

### Parte 4: Achadinhos com 20 ofertas teste (Mercado Livre)

Inserir 20 registros em `affiliate_deals` com links para mercadolivre.com.br, preços realistas, imagens Unsplash e categorias variadas.

### Parte 5: Aplicar também no provision-trial

**`supabase/functions/provision-trial/index.ts`** — Aplicar a mesma lógica de vinculação de `taxonomy_segment_id` nas lojas demo deste fluxo (que é duplicado).

---

## Arquivos a editar

| Arquivo | Ação |
|---|---|
| `supabase/functions/seed-demo-stores/index.ts` | Vincular taxonomy_segment_id, adicionar 12 lojas novas, inserir seções CMS e 20 achadinhos |
| `supabase/functions/provision-trial/index.ts` | Mesma vinculação de taxonomy_segment_id |


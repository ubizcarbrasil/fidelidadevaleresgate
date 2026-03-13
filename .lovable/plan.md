

## Problema: Categorias nao aparecem na Home

### Causa raiz

O `SegmentNavSection` agrupa lojas por **categoria pai** (`taxonomy_categories`). Todas as 12 lojas demo estao sob a mesma categoria "Alimentacao". O componente tem a regra `if (categories.length < 2) return null` — ou seja, com apenas 1 categoria, ele nao renderiza nada.

### Plano

#### 1. Migrar dados: diversificar categorias das lojas demo

Atribuir segmentos de outras categorias as lojas que ainda nao tem segmento:

| Loja | Segmento | Categoria |
|------|----------|-----------|
| Barbearia Premium | Barbearia (`f71243f7`) | Beleza e Estetica |
| Pet Love | (segment de Pets) | Pets |
| Power Suplementos | (segment de Esportes) | Esportes e Lazer |
| Farmacia Saude+ | (segment de Saude) | Saude e Bem-Estar |
| Cell Fix | (segment de Eletronicos) | Eletronicos e Games |
| Adega Bacchus | manter em Alimentacao ou Supermercados |

Isso garante 5+ categorias distintas, fazendo o `SegmentNavSection` renderizar.

#### 2. Verificar que o overlay "Ver todos" ja funciona

O `CategoryGridOverlay` ja esta conectado via `onSeeMore={() => setCategoryGridOpen(true)}` no `CustomerHomePage`. Uma vez que existam categorias suficientes, o botao "Ver mais" aparece e abre o grid de 2 colunas identico a imagem 2 de referencia.

### Arquivos

| Arquivo | Acao |
|---------|------|
| Nova migracao SQL | UPDATE stores SET taxonomy_segment_id para 6 lojas sem segmento |

Nenhuma alteracao de codigo necessaria — os componentes ja estao corretos.


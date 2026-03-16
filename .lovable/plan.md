

## Plano: Aplicar as 8 seções padrão em todas as marcas

### Situação atual
- **Urbano Norte** (8f76ce52): 13 seções (várias duplicadas e desorganizadas)
- **Ubiz Resgata** (db15bd21): 4 seções apenas

Ambas precisam ser substituídas pelas **8 seções padrão** do template "empreendedor-basico" já cadastrado no banco.

### O que será feito

#### 1. Limpar seções existentes
Para cada marca:
- Deletar `brand_section_sources` vinculadas
- Deletar `brand_section_manual_items` vinculadas  
- Deletar `brand_sections`

#### 2. Inserir as 8 seções padrão (para cada marca)
Usando os dados do template "empreendedor-basico" (id: dc74065d):

| # | Título | Template | Display | Rows | Filtros |
|---|--------|----------|---------|------|---------|
| 0 | Melhores Ofertas | OFFERS_CAROUSEL | carousel | 2 | todos |
| 1 | Deu fome? Pague com pontos | STORES_GRID | carousel | 2 | segmentos food |
| 2 | Food Pontos | OFFERS_CAROUSEL | carousel | 2 | segmentos food (imagem produto) |
| 3 | Beleza e Saúde | STORES_GRID | carousel | 1 | segmentos beleza |
| 4 | Serviços na Cidade | OFFERS_GRID | carousel | 1 | segmentos serviços |
| 5 | Achadinhos | STORES_GRID | grid | 3 | todos (achadinhos) |
| 6 | Lojas da Cidade | STORES_GRID | grid | 3 | todos |
| 7 | Resgate na Cidade | STORES_GRID | grid | 3 | todos |

Cada seção terá seu `brand_section_source` correspondente (OFFERS ou STORES).

### Execução
Operação de dados (INSERT/DELETE) via ferramenta de inserção — sem alteração de schema. Nenhuma mudança de código necessária.

### Arquivos alterados
Nenhum — apenas dados no banco.




## Criar Página Customizada de Exemplo com Sessões

### O que será feito

Criar uma página customizada chamada **"Vitrine de Teste"** (slug: `vitrine-teste`) com 3 sessões para validar o fluxo completo do motor:

1. **Carrossel de Ofertas** — tamanho P, 1 linha
2. **Grade de Lojas** — tamanho G, 2 linhas
3. **Destaques da Semana** — tamanho M, 1 linha

### Execução

Tudo via SQL direto no banco (sem mudanças em código):

1. **Inserir a página** na tabela `custom_pages` com `brand_id`, título, slug e `is_published = true`
2. **Inserir 3 registros** em `brand_sections` vinculados ao `page_id` da página criada, cada um com:
   - `template_id` correspondente ao template desejado
   - `icon_size` variando entre "small", "large" e "medium"
   - `rows_count` de 1 ou 2
   - `order_index` sequencial (0, 1, 2)
   - `is_enabled = true`

### Validação

Após criação, navegar até `/p/vitrine-teste` no preview para confirmar que:
- As 3 sessões renderizam
- Os tamanhos de card estão diferenciados (P vs M vs G)
- A grade de lojas exibe 2 linhas com scroll horizontal


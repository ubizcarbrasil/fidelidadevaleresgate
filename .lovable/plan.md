

## Plano: Seção "Junte pontos com seus parceiros" (estilo Livelo)

### O que será feito

Redesenhar a `EmissorasSection` na home do cliente para exibir parceiros emissores no formato de **lista vertical** (como no app Livelo nas imagens de referencia), com logo, nome, regra de pontuação ("X pontos por R$ 1"), botao de favorito (coracao), e um link "Todos os parceiros" que abre uma **pagina completa** com busca e listagem.

### Mudancas

**1. Redesenhar `EmissorasSection` (lista vertical na home)**
- Titulo: "Junte pontos com seus parceiros"
- Exibir no maximo 5 parceiros emissores em formato de lista (logo quadrado arredondado + nome + "X pontos por R$ 1" + coracao de favorito)
- Separador entre itens
- Botao "Todos os parceiros >" ao final que navega para pagina completa

**2. Criar tabela `customer_favorite_stores`**
- Migração para criar tabela com `customer_id`, `store_id`, `created_at`
- RLS policies para que o cliente so gerencie seus proprios favoritos
- A tabela `customer_favorites` existente so suporta `offer_id`, entao precisamos de uma nova para lojas

**3. Criar hook `useCustomerFavoriteStores`**
- Similar ao `useCustomerFavorites` existente, mas para lojas
- Funcoes `isFavoriteStore`, `toggleFavoriteStore`

**4. Criar pagina `CustomerEmissorasPage`**
- Pagina completa acessivel ao clicar "Todos os parceiros"
- Barra de busca por nome
- Filtros: "Meus favoritos"
- Lista completa de parceiros emissores com logo, nome, pontuacao, favorito
- Botao voltar

**5. Integrar navegacao no `CustomerLayout`**
- Adicionar overlay/pagina para a lista completa de emissoras
- Expor funcao `openEmissorasList` no contexto de navegacao

### Detalhes tecnicos

- Nova tabela `customer_favorite_stores(id uuid PK, customer_id uuid, store_id uuid, created_at timestamptz)` com unique constraint em `(customer_id, store_id)` e RLS
- O hook fara fetch dos favoritos do cliente logado e toggle via insert/delete otimista
- A `EmissorasSection` mostrara os primeiros 5 stores ordenados por nome, com layout identico ao screenshot (logo 70px arredondado, nome bold, "X pontos por R$ 1" em cinza, coracao a direita)
- A pagina completa tera `Input` de busca com filtro local e contagem de resultados


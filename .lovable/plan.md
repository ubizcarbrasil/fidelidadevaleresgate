
## Plano: corrigir o toggle de ativação das categorias de ACHADINHOS

### O que encontrei
O problema não é só visual.

1. **O toggle hoje ignora erro de update**
   - Em `src/pages/AffiliateCategoriesPage.tsx`, a função `toggleActive` faz:
   - `update({ is_active: active }).eq("id", id)`
   - mas **não verifica `error`** e nem mostra toast
   - então, se a atualização falhar, a interface apenas “volta” e parece que não desativa

2. **As categorias inativas somem da listagem por causa do RLS**
   - A query da página faz `select("*").eq("brand_id", currentBrandId)`
   - mas no backend a tabela `affiliate_deal_categories` só tem:
     - leitura pública para `is_active = true`
     - policies de `INSERT/UPDATE/DELETE` para admins da marca
   - **não existe uma policy de SELECT autenticado para admins/root**
   - resultado: ao desativar uma categoria, ela deixa de ser visível imediatamente para o admin, como se tivesse “sumido” ou como se a ação estivesse quebrada

### Correção proposta

#### 1. Corrigir o backend de leitura
Criar uma migration para adicionar policy de leitura autenticada em `affiliate_deal_categories`:

- **Brand admins/root** podem ver todas as categorias da própria marca, inclusive inativas
- manter a leitura pública apenas para categorias ativas

Isso resolve o comportamento de “não consigo desativar” porque a categoria continuará aparecendo como inativa no admin.

#### 2. Corrigir o toggle na página
Em `src/pages/AffiliateCategoriesPage.tsx`:

- transformar `toggleActive` em uma mutation com tratamento de erro
- validar `error` retornado pelo update
- exibir:
  - sucesso: “Categoria desativada/ativada”
  - erro: mensagem real do backend
- desabilitar temporariamente o switch enquanto a mutation roda, para evitar toques duplos

#### 3. Melhorar feedback visual
Ainda na página:

- manter categorias inativas visíveis com opacidade reduzida
- mostrar label clara “Ativo/Inativo” também fora do mobile, se necessário
- garantir revalidação correta com `invalidateQueries(["affiliate-categories", currentBrandId])`

### Arquivos
- `src/pages/AffiliateCategoriesPage.tsx`
- `supabase/migrations/...` nova migration para policy de `SELECT` autenticado em `affiliate_deal_categories`

### Detalhe técnico importante
Hoje o banco mostra que a marca principal tem **16 categorias, todas ativas**. Isso bate com o sintoma: provavelmente ninguém consegue deixar uma categoria inativa de forma estável porque:
- ou o update falha silenciosamente
- ou, quando funciona, a categoria some da consulta por falta de policy de leitura autenticada para itens inativos

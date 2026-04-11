

## Plano: Taxa de conversão personalizada por produto

### Problema atual
Hoje o custo em pontos de cada produto é definido pela taxa global (pts/R$) ou manualmente com valor fixo. Não existe opção de definir uma taxa de conversão personalizada por produto, que calcularia automaticamente o custo baseado no preço do produto.

### Mudanças

**1. Migração SQL** — Adicionar coluna `custom_points_per_real` na tabela `affiliate_deals`
```sql
ALTER TABLE affiliate_deals ADD COLUMN custom_points_per_real numeric DEFAULT NULL;
```
Quando `NULL`, usa a taxa global. Quando preenchido, o custo em pontos é recalculado como `preço × custom_points_per_real`.

**2. Modal de Edição por Produto** — Novo componente `ModalEditarResgatavel`
- Abre ao clicar em "Editar" no produto (novo botão na tabela/card)
- Campos editáveis:
  - **Público-alvo** (motorista/cliente/ambos)
  - **Custo em pontos** (editável diretamente)
  - **Taxa personalizada** (pts/R$) — campo opcional que, ao ser preenchido, recalcula o custo automaticamente com base no preço do produto
  - Preview: mostra o cálculo `Preço R$ X × Y pts/R$ = Z pts`
- Ao salvar, grava `redeem_points_cost`, `redeemable_by` e `custom_points_per_real`

**3. Atualizar `ModalAdicionarResgatavel`**
- Mostrar a taxa global atual (motorista/cliente) como referência
- Permitir que o usuário defina uma taxa personalizada por produto durante a adição (campo opcional)

**4. Atualizar `ProdutosResgatePage`**
- Adicionar botão "Editar" em cada linha/card que abre o `ModalEditarResgatavel`
- Na coluna/card de custo, indicar quando o produto tem taxa personalizada (badge ou ícone)
- No `BotaoRecalcularPontos`, respeitar a taxa personalizada do produto quando existir (usar `custom_points_per_real` em vez da global)

**5. Atualizar `BotaoRecalcularPontos`**
- Ao recalcular em lote, usar `custom_points_per_real` do produto quando existir, senão usar a taxa global

### Arquivos envolvidos
- 1 migração SQL (nova coluna)
- `src/pages/produtos_resgate/components/ModalEditarResgatavel.tsx` (novo)
- `src/pages/produtos_resgate/components/ModalAdicionarResgatavel.tsx` (atualizar)
- `src/pages/produtos_resgate/components/BotaoRecalcularPontos.tsx` (atualizar)
- `src/pages/ProdutosResgatePage.tsx` (atualizar)

### Resultado
O empreendedor pode definir uma taxa de conversão personalizada por produto, ver o cálculo em tempo real, e editar todos os campos de resgate em um modal dedicado. Produtos com taxa personalizada são recalculados corretamente em lote.


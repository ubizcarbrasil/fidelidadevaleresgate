

# Recalcular custo em pontos dos produtos já ativados (taxa 40 pts/R$)

## Problema
Os produtos já marcados como resgatáveis foram salvos com a taxa antiga (1 pt/R$). Por isso:
- R$ 17,99 → 18 pts (deveria ser **720 pts**)
- R$ 62,69 → 63 pts (deveria ser **2.508 pts**)
- R$ 169,99 → 170 pts (deveria ser **6.800 pts**)

Os valores no banco estão incorretos e precisam ser recalculados.

## Solução

### 1. Migração SQL — recalcular todos os produtos resgatáveis
Executar uma migração que atualiza `redeem_points_cost = CEIL(price * 40)` para todos os `affiliate_deals` onde `is_redeemable = true` e `price > 0`.

```sql
UPDATE affiliate_deals
SET redeem_points_cost = CEIL(price * 40)
WHERE is_redeemable = true
  AND price IS NOT NULL
  AND price > 0;
```

### 2. Adicionar botão "Recalcular Pontos" na página `/produtos-resgate`
Para que o admin possa recalcular em massa no futuro (caso a taxa mude), adicionar um botão na toolbar que:
- Busca a taxa `points_per_real` das configurações da marca
- Atualiza todos os produtos resgatáveis com `CEIL(price * taxa)`
- Exibe confirmação antes de executar
- Mostra toast de sucesso com quantidade atualizada

### Alterações de arquivo
- **Migração SQL**: `UPDATE` em massa dos valores existentes
- **`src/pages/ProdutosResgatePage.tsx`**: Adicionar botão "Recalcular Pontos" na barra de ações


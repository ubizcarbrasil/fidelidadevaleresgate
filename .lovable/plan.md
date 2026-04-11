

## Plano: Adicionar seletor de público-alvo no modal de adicionar produtos resgatáveis

### Problema atual
O modal `ModalAdicionarResgatavel` marca produtos como resgatáveis mas nao define o campo `redeemable_by`, ficando sem público-alvo. Tambem usa apenas a taxa base de conversao, ignorando as taxas separadas de motorista/passageiro.

### Mudancas em `src/pages/produtos_resgate/components/ModalAdicionarResgatavel.tsx`

1. **Adicionar estado `publicoAlvo`** com opcoes "driver", "customer" ou "both" (default: "driver")

2. **Adicionar seletor visual** (segmented buttons ou Select) antes da lista de produtos, com as opcoes:
   - Motorista
   - Passageiro  
   - Ambos

3. **Usar taxa correta no calculo automatico**: quando `publicoAlvo` for "driver" usar `taxasConversao.driver`, "customer" usar `taxasConversao.customer`, "both" usar `Math.max(driver, customer)`

4. **Incluir `redeemable_by` no update**: nas mutacoes de insert, adicionar `redeemable_by: publicoAlvo` junto com `is_redeemable: true`

5. **Atualizar label do toggle automatico** para mostrar a taxa do publico selecionado (ex: "Usa preco x 60 pt/R$" para passageiro)

### Resultado
- O empreendedor escolhe para quem o produto sera resgatavel ao adicioná-lo
- A taxa de conversao correta e aplicada automaticamente
- O campo `redeemable_by` e salvo corretamente no banco
- Um arquivo alterado


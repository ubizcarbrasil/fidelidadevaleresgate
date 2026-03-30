

# Atualizar default da taxa de conversão para 40 pts/R$

## Problema
O default atual de `points_per_real` é `1`. O correto para o negócio é `40` pontos por R$ 1,00.

## Alterações

### 1. `src/pages/RegrasResgatePage.tsx`
- Alterar `DEFAULTS.points_per_real` de `1` para `40`

### 2. `src/pages/produtos_resgate/components/ModalAdicionarResgatavel.tsx`
- Alterar o fallback `|| 1` para `|| 40` na query de `pointsPerReal`
- Atualizar o texto de exibição que mostra a taxa (já dinâmico)

### Resultado
- A página Regras de Resgate já permite editar o valor — apenas o default muda
- O modal de adicionar produtos usará 40 como fallback quando não houver configuração salva
- Exemplo: produto de R$ 17,99 → `Math.ceil(17.99 × 40)` = **720 pts**


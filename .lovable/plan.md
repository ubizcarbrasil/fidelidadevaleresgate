

## Plano: Corrigir cor do texto do campo CPF

### Problema
O input de CPF no modal de confirmação de resgate não tem cor de texto definida, herdando a cor do container (branco sobre fundo escuro), tornando o texto digitado invisível.

### Solução

**Arquivo:** `src/pages/customer/CustomerOfferDetailPage.tsx`, linha 1092-1093

Adicionar `color: "#000"` e `backgroundColor: "#fff"` no style inline do input, garantindo que o texto digitado seja sempre preto sobre fundo branco, independente do tema da marca.


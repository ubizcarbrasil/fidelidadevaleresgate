

## Plano: Trocar ícone Gift por Coins nos cards de "Compre com Pontos"

### Problema
Nos cards da seção "Compre com Pontos", o ícone ao lado do preço em pontos e no fallback da imagem/logo ainda é o `Gift` (presente). O usuário quer que seja o ícone `Coins` (moedas).

### Alterações

**Arquivo**: `src/components/customer/CompreComPontosSection.tsx`

Substituir as 3 ocorrências restantes de `<Gift>` por `<Coins>` dentro do componente `RedeemDealCard`:

1. **Linha 75** — fallback quando não há imagem do produto → trocar `Gift` por `Coins`
2. **Linha 87** — fallback quando não há logo da loja (canto superior direito) → trocar `Gift` por `Coins`
3. **Linha 98** — ícone ao lado do preço em pontos → trocar `Gift` por `Coins`

Remover `Gift` do import (já não será mais usado).

### Resultado
Todos os ícones nos cards passam a ser moedas (🪙) em vez de presente (🎁), consistente com o tema "Compre com Pontos".


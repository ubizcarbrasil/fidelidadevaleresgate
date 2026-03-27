

## Plano: Layout mobile para lista de motoristas

### Problema
No mobile (430px), os cards dos motoristas estão cortados — as colunas "Saldo", "Corridas" e os botões de ação ficam fora da tela.

### Solução
Refatorar cada card de motorista para empilhar verticalmente no mobile, usando layout de card compacto em vez de linha horizontal.

### Arquivo a editar
`src/pages/DriverManagementPage.tsx` — bloco do card de cada motorista (linhas 186-243)

### Layout mobile proposto

```text
┌─────────────────────────────────┐
│ 🚛  Nome do Motorista    BRONZE │
│     CPF: •••.123.456-78         │
│     Tel: (11) 99999-9999        │
│                                 │
│  Saldo: 45 pts  Corridas: +20  │
│              [🎁]  [👁]        │
└─────────────────────────────────┘
```

### Detalhes técnicos
- No mobile: card usa `flex-col` com seções internas empilhadas
- Linha superior: ícone + nome + badges (tier, pontuação desativada)
- Linha de dados: CPF, telefone (texto menor)
- Linha inferior: badges de saldo e corridas à esquerda, botões de ação à direita
- No desktop (sm+): manter layout horizontal atual
- Usar classes responsivas (`flex-col sm:flex-row`, `sm:items-center`)
- Esconder label "Corridas" no mobile para economizar espaço, mantendo apenas os badges com pontos




# Redesign do Header do Painel do Motorista

## Problema
O header atual comprime logo, nome, badge de pontos e 4 ícones em uma única linha, ficando visualmente poluído e sem destaque para os pontos.

## Solução
Reorganizar o header em **duas linhas**:

1. **Linha 1**: Logo + nome da marca à esquerda, ícones de ação (perfil, ajuda, WhatsApp, compartilhar) à direita
2. **Linha 2 (destaque)**: Card de pontos em largura total com visual premium — ícone de moeda, saldo grande e bold, label "pontos" ao lado, com fundo gradiente usando a cor primária da marca

### Visual do card de pontos
- Fundo com gradiente sutil da cor primária (15% → 5%)
- Borda arredondada (rounded-2xl)
- Ícone `Coins` maior (h-5 w-5)
- Saldo em tamanho `text-xl font-extrabold` com a cor primária
- Label "pontos" em texto menor ao lado
- Clicável → abre perfil (mesmo comportamento atual)

### Arquivo
- **Editar**: `src/components/driver/DriverMarketplace.tsx` — Reestruturar linhas 398-460

### Layout (ASCII)
```text
┌─────────────────────────────────────────┐
│ [logo] ACHADINHOS    [👤] [❓] [💬] [↗] │  ← linha 1
├─────────────────────────────────────────┤
│  🪙  617 pontos                    →    │  ← card pontos destaque
├─────────────────────────────────────────┤
│ 🔍 O que está procurando?               │  ← search
└─────────────────────────────────────────┘
```


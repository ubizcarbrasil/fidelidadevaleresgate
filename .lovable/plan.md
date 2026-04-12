

## Plano: Redesenhar card de pontos com destaque premium

### Problema
O botão de pontos atual é pequeno e discreto, alinhado à direita do greeting. Não chama atenção suficiente como elemento principal da home.

### Solução
Transformar o botão de pontos em um **card full-width** abaixo do greeting, com visual premium e impactante.

### Alterações

**Arquivo**: `src/pages/customer/CustomerHomePage.tsx`

- Separar o bloco de pontos do header (tirá-lo do `flex justify-between`)
- Criar um card full-width (`mx-4 mt-3`) com:
  - Fundo gradiente forte (accent/primary) com overlay decorativo (círculos/brilho)
  - Pontos em fonte grande (~28px) e bold, centralizado ou à esquerda
  - Label "Meus Pontos" acima do valor
  - Botão/link "Ver extrato →" com destaque visual (borda ou fundo contrastante)
  - Ícone de moeda decorativo
  - Sombra pronunciada (`shadow-lg`) e bordas arredondadas (`rounded-2xl`)
  - Animação sutil de entrada (`animate-fade-in`)
- Manter o `onClick` que abre o ledger

### Visual esperado (referência da imagem)
```text
┌──────────────────────────────────┐
│  Boa noite, Alecio 👋            │
│  📍 Leme                         │
├──────────────────────────────────┤
│ ┌──────────────────────────────┐ │
│ │  💰 Meus Pontos              │ │
│ │  92.890 pts                  │ │
│ │              Ver extrato →   │ │
│ └──────────────────────────────┘ │
```

### Arquivo

| Arquivo | Ação |
|---------|------|
| `src/pages/customer/CustomerHomePage.tsx` | Redesenhar card de pontos como bloco full-width com destaque visual |


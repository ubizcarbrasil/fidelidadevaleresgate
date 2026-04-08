

## Corrigir Layout Responsivo dos Cards de Cidade

### Problema
Em telas mobile (430px), o card de cada cidade exibe badges, switch e botões de ação numa única linha horizontal. Os elementos ultrapassam a largura disponível e o botão de reset fica oculto por overflow.

### Solução
Reorganizar o layout do card em mobile para empilhar os elementos em duas linhas:
- **Linha 1**: Nome da cidade + botões de ação (reset, editar, switch)
- **Linha 2**: Badges (scoring model, resgate cidade, status)

### Arquivo modificado
`src/pages/BrandBranchesPage.tsx`

### Mudanças
- Reestruturar o `CardContent` para usar `flex-wrap` ou empilhar verticalmente em telas pequenas
- Mover badges para uma linha separada abaixo do nome/ações em mobile
- Garantir que os botões de ação (switch, reset, editar) fiquem sempre visíveis
- Usar classes responsivas do Tailwind (`sm:`, `md:`) para manter o layout horizontal em desktop

### Layout esperado (mobile)
```text
┌──────────────────────────────┐
│ 📍 Cidade Nome    🔄 ✏️ [⟲] │
│ Estado                       │
│ [Misto] [Resgate] [Ativa] ● │
└──────────────────────────────┘
```

### Layout esperado (desktop — sem mudança)
```text
┌──────────────────────────────────────────────────────────────┐
│ 📍 Cidade Nome  |  [Misto] [Resgate] [Ativa] ● [⟲] [✏️]   │
└──────────────────────────────────────────────────────────────┘
```


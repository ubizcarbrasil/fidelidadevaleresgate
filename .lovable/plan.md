

## Plano: Permitir edição de título, preço e descrição na tela de review

### O que muda

Na etapa "review" do `AchadinhosMobileImportPage`, ao clicar no card do produto, ele expande mostrando campos editáveis para **título**, **descrição**, **preço** e **preço original**. O usuário corrige inline e o estado é atualizado antes de publicar.

### Implementação

**`src/pages/AchadinhosMobileImportPage.tsx`**

1. Adicionar estado `editingId` para controlar qual card está expandido
2. Adicionar função `updateProduct(id, field, value)` que atualiza o produto no array `products`
3. No step "review", ao clicar no card (exceto no X), alternar `editingId`
4. Quando `editingId === p.id`, renderizar abaixo da linha atual:
   - `Input` para título
   - `Textarea` para descrição (2 linhas)
   - Dois `Input type="number"` lado a lado: preço e preço original
5. Cada campo usa `onBlur` ou `onChange` para chamar `updateProduct`

### Visual esperado

Card normal (fechado): igual ao atual — imagem, título, preço, botão X

Card expandido (ao tocar): mesma info + campos editáveis abaixo:
```text
┌─────────────────────────────────┐
│ [img]  Smartwatch Original...  X│
│        R$ 211,09  R$ 351,00     │
│ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─│
│  Título: [___________________]  │
│  Descrição: [________________]  │
│  Preço: [____]  Original:[____] │
└─────────────────────────────────┘
```

### Arquivo
- `src/pages/AchadinhosMobileImportPage.tsx`


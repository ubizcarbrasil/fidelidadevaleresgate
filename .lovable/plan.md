

## Plano: Fix do botão "Resetar Pontos" não clicável

### Diagnóstico

O `DialogResetPontos` usa dois modais empilhados:
1. `Dialog` (principal, com as opções de escopo)
2. `ConfirmDialog` (AlertDialog de confirmação)

Quando o botão "Resetar Pontos" é clicado, `showConfirm` vira `true` e o `ConfirmDialog` abre **por trás** do `Dialog` principal. O overlay do Dialog principal bloqueia os cliques no AlertDialog.

### Correção

**Arquivo:** `src/components/branch/DialogResetPontos.tsx`

Fechar temporariamente o Dialog principal ao abrir o ConfirmDialog, ou (solução mais simples e robusta) mover o `ConfirmDialog` para dentro do `DialogContent` e usar `portal` adequado.

**Abordagem escolhida:** Ao clicar em "Resetar Pontos", fechar o Dialog pai antes de abrir o ConfirmDialog. Ao cancelar o confirm, reabrir o Dialog pai.

Alternativamente (mais limpo): adicionar `style={{ zIndex: 100 }}` ou usar a prop `forceMount` no AlertDialogContent para garantir que fique acima. A solução mais confiável é controlar o estado para fechar o Dialog pai quando o confirm abre:

```text
// onClick do botão "Resetar Pontos":
// 1. Fechar o dialog principal (onClose)
// 2. Abrir o confirm dialog (setShowConfirm(true))

// No onClose do ConfirmDialog:
// 1. Se cancelou, reabrir o dialog principal
```

Mas isso é complexo. A solução mais simples: adicionar `className="z-[200]"` no `AlertDialogContent` do `ConfirmDialog` para garantir que fique acima do Dialog.

### Alteração

| Arquivo | Mudança |
|---------|---------|
| `src/components/ui/confirm-dialog.tsx` | Adicionar classe de z-index elevado (`z-[200]`) no `AlertDialogContent` e no overlay para garantir que fique acima de qualquer Dialog aberto |


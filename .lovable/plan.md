

## Problema

O `ImageCropDialog` usa `modal={false}` (linha 98 de `ImageCropDialog.tsx`), o que permite interação com o conteúdo por trás do diálogo. No mobile (430px), ao selecionar uma imagem para upload nos Achadinhos, o diálogo de recorte abre sem bloquear a tela — qualquer toque fora dele fecha o diálogo e pode causar navegação indesejada ou troca de aba, dando a impressão de que "fechou".

Além disso, o `ImageUploadField` tem limite de 2MB, muito restritivo para fotos de produto (o componente de ofertas da loja permite 5MB).

## Alterações

### 1. Corrigir `ImageCropDialog.tsx` — tornar modal verdadeiro
**Linha 98**: Remover `modal={false}` para usar o padrão `modal={true}`, bloqueando interação com o fundo.

```tsx
// DE:
<Dialog open={open} onOpenChange={(v) => !v && onCancel()} modal={false}>

// PARA:
<Dialog open={open} onOpenChange={(v) => !v && onCancel()}>
```

### 2. Aumentar limite de upload em `ImageUploadField.tsx`
**Linha 61**: Mudar o limite de 2MB para 5MB, consistente com outros componentes de upload.

```tsx
// DE:
if (file.size > 2 * 1024 * 1024) {
  toast.error("Arquivo muito grande. Máximo 2MB.");

// PARA:
if (file.size > 5 * 1024 * 1024) {
  toast.error("Arquivo muito grande. Máximo 5MB.");
```

**2 arquivos, 2 linhas alteradas.**


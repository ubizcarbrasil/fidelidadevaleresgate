

## Diagnóstico

O problema acontece **apenas no celular** e **aleatoriamente durante o preenchimento**. Analisando o código e os logs:

1. **`ImageCropDialog` usa Radix `Dialog`** que no mobile aplica `pointer-events: none` no body e manipula focus. Quando o dialog fecha, o focus retorna ao trigger dentro do `TabsContent`. No mobile, isso pode causar scroll/unmount do conteúdo da aba.

2. **`TabsContent` desmonta ao perder ativação** — se qualquer evento de focus ou re-render causar a troca da aba internamente, todo o conteúdo (incluindo drafts preenchidos) é desmontado e o formulário "some".

3. **Re-renders em cascata** — upload de imagem → `onChange` → `setDrafts` → re-render do componente inteiro → `ImageCropDialog` fecha → focus shift → pode causar a aba a "fechar".

## Correção

**Arquivo: `src/pages/AffiliateDealsPage.tsx`**

1. **Adicionar `forceMount` no `TabsContent` da aba "manual"** — isso mantém o DOM montado mesmo quando a aba não está ativa, evitando perda de dados. Esconder visualmente com `hidden` quando inativa:
   ```tsx
   <TabsContent value="manual" forceMount className={activeTab !== "manual" ? "hidden" : "space-y-4"}>
   ```

2. **Fazer o mesmo para a aba "csv"** para consistência.

**Arquivo: `src/components/ImageCropDialog.tsx`**

3. **Adicionar `modal={false}` no Dialog** — isso evita que o Radix Dialog bloqueie interações no body e manipule focus de forma agressiva no mobile:
   ```tsx
   <Dialog open={open} onOpenChange={(v) => !v && onCancel()} modal={false}>
   ```

4. **Adicionar `onOpenAutoFocus={(e) => e.preventDefault()}`** no `DialogContent` para evitar que o focus shift cause problemas no mobile.

## Arquivos afetados
- `src/pages/AffiliateDealsPage.tsx` — `forceMount` + classe condicional nos TabsContent
- `src/components/ImageCropDialog.tsx` — `modal={false}` + prevenção de auto-focus


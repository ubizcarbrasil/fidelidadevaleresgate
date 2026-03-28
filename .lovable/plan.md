

# Adicionar recorte manual de imagem no wizard de cupons

## Problema
Atualmente o `StepImage.tsx` do wizard de cupons faz upload direto da imagem sem passar pelo `ImageCropDialog`, resultando em imagens sem enquadramento adequado no app do cliente (como visto nas screenshots).

## Solução
Integrar o `ImageCropDialog` (já existente no projeto) ao `StepImage.tsx`, da mesma forma que o `ImageUploadField.tsx` já faz. Quando o lojista selecionar uma imagem, o dialog de recorte abre antes do upload, permitindo enquadrar manualmente.

## Arquivo afetado
**`src/components/store-voucher-wizard/steps/StepImage.tsx`**

## Mudanças
1. Importar `ImageCropDialog`
2. Adicionar estados `cropSrc` e `pendingFile` (mesmo padrão do `ImageUploadField`)
3. No `handleUpload`: em vez de fazer upload direto, ler o arquivo como DataURL e abrir o crop dialog
4. Criar `handleCropped`: recebe o blob recortado, faz upload no storage e atualiza o `image_url`
5. Criar `handleCropCancel`: fecha o dialog e faz upload da imagem original (sem recorte)
6. Renderizar o `<ImageCropDialog>` com `aspectRatio` livre (undefined) para que o lojista escolha o enquadramento
7. Manter todo o restante intacto (IA actions, preview, botões, tipo STORE)

## Resultado
O lojista poderá enquadrar/recortar a imagem do produto antes de publicar, garantindo que a imagem apareça bem no card do app do cliente.


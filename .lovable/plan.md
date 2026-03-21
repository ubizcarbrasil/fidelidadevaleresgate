

## Plano: Adicionar upload de imagem do produto no review

### Problema

Quando o usuário importa via "Print da Oferta", os dados de texto são extraídos (título, preço, descrição), mas o campo `image_url` fica `null`. O produto é publicado sem imagem, o que prejudica a vitrine.

### Solução

Adicionar um botão de upload de imagem dentro do card expandido (review), para cada produto. O usuário toca no botão, seleciona/tira uma foto do produto, a imagem é enviada para o storage `brand-assets` e o campo `image_url` é preenchido automaticamente.

### Implementação

**`src/pages/AchadinhosMobileImportPage.tsx`**

1. Adicionar um `ref` para input de imagem de produto (`productImageRef`)
2. Criar estado `uploadingImageId` para saber qual card está com upload em andamento
3. Criar função `handleProductImageUpload`:
   - Recebe o arquivo
   - Faz upload para `brand-assets` no path `achadinhos/{timestamp}.{ext}`
   - Obtém a URL pública
   - Atualiza o produto via `updateProduct(id, "image_url", url)`
4. No card expandido (editingId === p.id), adicionar:
   - Se já tem `image_url`: preview da imagem com botão de trocar
   - Se não tem: botão "Adicionar imagem" com ícone de câmera
   - Input file hidden com `accept="image/*"`
5. O botão fica entre os campos de edição e o "Corrigir via print"

### Visual no card expandido

```text
┌─────────────────────────────────┐
│ [placeholder]  Smartwatch...   X│
│               R$ 211,09         │
│ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─│
│  [preview img]  [📷 Trocar]     │  ← novo
│  Título: [___________________]  │
│  Descrição: [________________]  │
│  Preço: [____]  Original:[____] │
│  Link: [_____________________]  │
│  [📷 Corrigir via print]        │
└─────────────────────────────────┘
```

### Arquivos
- `src/pages/AchadinhosMobileImportPage.tsx` — botão de upload + lógica de storage


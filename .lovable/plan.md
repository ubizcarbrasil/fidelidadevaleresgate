

## Plano: Assistente de Imagem com IA em todos os pontos de upload

### Visão geral
Criar um componente `ImageAiEnhancer` que aparece como um painel de ações após o upload de qualquer imagem. Ele oferece 3 opções com IA:

1. **Redesenhar** — Usa a imagem como referência e gera uma nova imagem do zero com maior qualidade
2. **Ajustar tamanho** — Redimensiona/adapta a imagem ao tamanho ideal do contexto (banner, logo, produto)
3. **Melhorar qualidade** — Aprimora nitidez, cores e diagramação mantendo a imagem original

### Arquitetura

```text
Upload da imagem
  → Preview aparece
  → 3 botões de IA surgem abaixo:
      [✨ Redesenhar]  [📐 Ajustar]  [🔍 Melhorar]
  → Clique envia para Edge Function
  → Edge Function chama Lovable AI (modelo de imagem)
  → Resultado volta como nova imagem
  → Usuário pode aceitar ou descartar
```

### Implementação

**1. Edge Function `enhance-image/index.ts`**
- Recebe: `image_url`, `mode` (redesign | resize | enhance), `context` (banner | logo | product | offer)
- Cada modo gera um prompt diferente para o modelo de imagem:
  - `redesign`: "Use this image as reference. Create a professional, high-quality version..."
  - `resize`: Usa canvas no backend para redimensionar ao tamanho ideal do contexto (ex: banner 1200×514, logo 512×512, produto 800×800)
  - `enhance`: "Enhance this image: improve sharpness, color balance, lighting..."
- Usa `google/gemini-3.1-flash-image-preview` para redesenhar e melhorar
- Resize usa processamento direto (sem IA) com ajuste de proporção
- Salva resultado no Storage `brand-assets` e retorna a URL pública
- Trata erros 429/402 com mensagens claras

**2. Componente `ImageAiActions.tsx`**
- Props: `imageUrl`, `onReplace(newUrl)`, `context` (para saber dimensões ideais)
- Mostra 3 botões com ícones quando há imagem
- Ao clicar, abre dialog de loading com preview do resultado
- Botões "Usar esta" / "Descartar"
- Estado de processamento com animação

**3. Integrar nos componentes de upload existentes**
- `ImageUploadField.tsx` — adicionar `ImageAiActions` abaixo do preview (usado em ~13 lugares: logo, favicon, banner, fundo, etc.)
- `StepImage.tsx` (wizard de cupom do lojista) — adicionar após upload
- `StorageImageUpload.tsx` (page builder) — adicionar após preview
- Cada local passa o `context` adequado para dimensionamento correto

**4. Mapa de dimensões por contexto**

| Contexto | Dimensão ideal |
|---|---|
| banner | 1200 × 514 |
| logo | 512 × 512 |
| favicon | 256 × 256 |
| product / offer | 800 × 800 |
| background | 1920 × 1080 |
| gallery | 1080 × 1080 |

### Arquivos envolvidos
- **Novo**: `supabase/functions/enhance-image/index.ts`
- **Novo**: `src/components/ImageAiActions.tsx`
- **Editar**: `src/components/ImageUploadField.tsx` — inserir `ImageAiActions`
- **Editar**: `src/components/store-voucher-wizard/steps/StepImage.tsx` — inserir `ImageAiActions`
- **Editar**: `src/components/page-builder/StorageImageUpload.tsx` — inserir `ImageAiActions`

### Pré-requisitos
- `LOVABLE_API_KEY` já está configurada ✅
- Bucket `brand-assets` já é público ✅
- Modelo `google/gemini-3.1-flash-image-preview` disponível ✅

### Resultado
Em todo local do sistema onde o lojista ou empreendedor sobe uma imagem, ele terá 3 opções inteligentes para melhorar automaticamente a qualidade visual do seu conteúdo sem precisar de conhecimento em design.


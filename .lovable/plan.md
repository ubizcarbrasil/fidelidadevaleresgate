

## Plano: Import via Print com múltiplos produtos + associação de links

### O que muda

Novo método de importação **"Print da Oferta"** que aceita um screenshot contendo múltiplos produtos (como os prints do Mercado Livre, Méliuz etc.). O usuário:

1. Envia o print
2. A IA extrai todos os produtos visíveis (título, preço, preço original, loja)
3. O usuário informa os links de afiliado (um por linha) para associar aos produtos extraídos
4. Os links são pareados com os produtos na ordem. Se sobrar link sem produto correspondente, ele fica sinalizado como "sem correspondência na imagem"

### Fluxo

```text
Método → "Print da Oferta" → Selecionar imagem
   ↓
IA extrai N produtos → Tela de associação de links
   ↓
Usuário cola links (1 por linha) → Sistema pareia link ↔ produto
   ↓
Review (produtos com link + links órfãos sinalizados) → Publicar
```

### Implementação

**1. Nova edge function `extract-products-from-image/index.ts`**

- Recebe `{ image_base64 }`
- Usa Lovable AI (Gemini 2.5 Flash — suporta visão) via tool calling para extrair array estruturado
- Prompt: "Extraia TODOS os produtos visíveis nesta imagem. Para cada um retorne: title, description, price, original_price, store_name"
- Schema via `tools` para garantir JSON estruturado
- Retorna `{ products: [...] }`

**2. Novo step `"photo"` no `AchadinhosMobileImportPage.tsx`**

- Adicionar ao type `Step`: `"photo" | "photo-links"`
- Card na tela de método: ícone Camera, "Print da Oferta", descrição "Envie um print com vários produtos. A IA identifica todos automaticamente."
- Step "photo": botão para escolher imagem (`accept="image/*" capture="environment"`)
- Ao selecionar, converte para base64, chama edge function, mostra loading com Sparkles

**3. Novo step `"photo-links"` — associação de links**

- Mostra os produtos extraídos (miniatura com título e preço)
- Abaixo, Textarea para colar os links (um por linha)
- Ao clicar "Associar Links":
  - Pareia link[0] → produto[0], link[1] → produto[1], etc.
  - Se `links.length > products.length`, os links excedentes viram cards sinalizados com badge "Sem correspondência" em amarelo
  - Se `links.length < products.length`, os produtos sem link ficam com campo vazio (editável no review)
- Vai para step "review" com tudo pronto para edição e publicação

**4. Sinalização visual no review**

- Produtos sem link: badge amarelo "Sem link"
- Links órfãos (sem produto na imagem): card com borda amarela e badge "Sem correspondência na imagem", permitindo editar título/preço manualmente

**5. Botão "Corrigir via print" no card expandido (review)**

- No painel de edição de cada produto individual, botão com ícone Camera
- Envia print → extrai dados → preenche campos daquele produto específico

### Arquivos

- `supabase/functions/extract-products-from-image/index.ts` — nova edge function
- `src/pages/AchadinhosMobileImportPage.tsx` — novos steps + lógica de pareamento
- Step indicator atualizado para 4 dots quando vindo do fluxo "photo"


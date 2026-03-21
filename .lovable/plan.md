

## Plano: Enriquecer produtos do fluxo "photo" com scraping dos links

### Problema

No fluxo "Print da Oferta", após associar os links aos produtos extraídos pela IA, o sistema vai direto para o review sem buscar a imagem do produto nos links. No fluxo de "colar links", o `scrape-product` já puxa `image_url`, `category_id`, etc. — mas o fluxo de foto não aproveita isso.

### Solução

Após o usuário associar os links no step `photo-links`, fazer scraping de cada link (usando a mesma edge function `scrape-product`) para puxar a imagem e enriquecer os dados. Os campos extraídos pela IA (título, preço, descrição) são mantidos como prioridade; o scraping complementa apenas o que está faltando (imagem, categoria, loja).

### Implementação

**`src/pages/AchadinhosMobileImportPage.tsx`**

Alterar `handleAssociateLinks`:

1. Após parear links com produtos, iniciar scraping dos links em paralelo (batches de 5, igual ao fluxo de links)
2. Mostrar loading com progresso ("Buscando imagens... 3/8")
3. Para cada link scrapeado com sucesso, enriquecer o produto correspondente:
   - `image_url`: usar do scrape se o produto não tiver
   - `category_id` / `category_name`: usar do scrape se não tiver
   - `store_name`: usar do scrape se estiver vazio
   - Título, descrição, preço: manter os da IA (já extraídos do print)
4. Após finalizar, ir para step "review" com produtos já enriquecidos

### Fluxo atualizado

```text
Print → IA extrai texto → Cola links → Pareia link↔produto
  ↓
Scrape links (busca imagem + categoria) → Review com imagem preenchida
```

### Arquivo
- `src/pages/AchadinhosMobileImportPage.tsx` — alterar `handleAssociateLinks` para incluir scraping


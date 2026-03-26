

## Integrar dvlinks.com.br como nova fonte de espelhamento

### Contexto
O site dvlinks.com.br expõe ofertas em formato de cards HTML com: título, imagem (Mercado Livre), preço original, preço atual, link de afiliado e data. Possui paginação (5+ páginas). A estrutura é simples e pode ser raspada via Firecrawl (já conectado) ou fetch direto.

### Abordagem
Adicionar suporte a **múltiplas origens** no sistema de espelhamento existente, sem quebrar o fluxo atual do Divulgador Inteligente.

### Alterações

**1. Banco de dados — tabela `mirror_sync_config`**
- Adicionar coluna `source_type` (text, default `'divulgador_inteligente'`) para distinguir a origem
- Permitir múltiplas configs por brand (uma por fonte)

**2. Edge Function `mirror-sync/index.ts`**
- Criar função `scrapeDvlinks(baseUrl, maxPages)` que:
  - Busca cada página (`?page=1`, `?page=2`, etc.) via fetch direto
  - Extrai do HTML: título, imagem, preço original, preço atual, link de afiliado
  - Usa o link de afiliado como `origin_external_id` para deduplicação
- No handler principal, verificar `source_type` da config:
  - `divulgador_inteligente` → fluxo atual (API + vitrine)
  - `dvlinks` → novo fluxo de scrape HTML
- Reutilizar a mesma lógica de categorização por keywords e auto-categorização

**3. UI — `MirrorSyncConfig.tsx`**
- Adicionar seletor de "Tipo de Fonte" (Divulgador Inteligente / DVLinks)
- Quando DVLinks selecionado, mostrar campo de URL base (pré-preenchido com `https://dvlinks.com.br/g/achadinhosresgata-69a302fc25d02`)
- Adicionar campo "Máx. páginas" (default 5)

**4. UI — `MirrorSyncPage.tsx`**
- Permitir visualizar e acionar sync de cada fonte separadamente
- Logs e KPIs filtrados por origem

### O que NÃO muda
- Estrutura da tabela `affiliate_deals` (já tem `origin` text que suporta novos valores)
- Lógica de categorização por keywords (reutilizada)
- Fluxo do Divulgador Inteligente continua funcionando igual
- Auth, guards, bootstrap, RLS — tudo inalterado

### Dados extraídos do DVLinks por card
- **Título**: texto do `## heading`
- **Imagem**: URL do `mlstatic.com` (imagem do Mercado Livre)
- **Preço original**: primeiro valor (ex: R$99.90)
- **Preço atual**: segundo valor (ex: R$88.97)
- **Link afiliado**: `meli.la/...` ou similar (href do botão "Ir à loja")
- **Loja**: texto do botão (ex: "Mercadolivre")


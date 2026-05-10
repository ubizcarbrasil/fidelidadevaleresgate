# Prompt complementar — funcionalidades que faltaram no novo projeto

Cole o texto abaixo no projeto `ofertasubizresgata.lovable.app` (em uma nova mensagem). Ele cobre tudo que aparece nas screenshots IMG_7018 a IMG_7027 e que não foi entregue na primeira rodada.

---

## PROMPT (copie tudo a partir daqui)

O projeto evoluiu, mas faltaram blocos inteiros do módulo **Achadinhos / Ofertas** que existem no produto original. Quero que você implemente exatamente o que descrevo abaixo, mantendo arquitetura SaaS multi-marca, RLS por `brand_id`, padrão `snake_case` em pastas/arquivos, componentes em PascalCase e tudo em português brasileiro. Backend é Lovable Cloud.

### 1. Grupo de menu "ACHADINHOS" no painel admin

Criar um grupo no sidebar do admin chamado **ACHADINHOS** com estes itens (cada um é uma rota):

1. **Achadinhos** — listagem CRUD de ofertas (ícone carrinho)
2. **Categorias de Achadinhos** — CRUD de categorias + configurações de detalhe (ícone pasta)
3. **Ubiz Ofertas (Vitrine Pública)** — link/preview da vitrine pública da marca (ícone globo)
4. **Espelhamento Achadinho** — importação automática de ofertas externas (ícone refresh)
5. **Governança Achadinho** — políticas, regras de exposição e auditoria (ícone escudo)

Grupo deve ser colapsável. Usar `MENU_REGISTRY` central para registrar.

### 2. Tela "Achadinhos" — listagem de ofertas (IMG_7019)

Header com título **Achadinhos** + subtítulo "Gerencie ofertas de afiliados do marketplace".

Botão **"Importar pelo Celular"** (ícone celular) que abre modal com QR code + URL curta para o admin abrir no celular e enviar fotos/links rapidamente.

Abas:
- **Listagem** (default)
- **+ Adicionar em Massa** — colar várias URLs de uma vez, processa via edge function `scrape-product` em batch
- **Importar Planilha** — upload de CSV/XLSX com colunas `titulo, preco, preco_original, url, imagem, categoria, loja`

Na aba Listagem:
- Campo de busca **"Buscar achadinho..."** (debounce 300ms)
- Paginação com `1–20 de 1253` à esquerda + setas + indicador `1/63` à direita (paginação server-side, 20 por página)
- Filtro **"Filtro resgate:"** com 3 botões pill: **Todos** / **Não resgatáveis** / **🎁 Resgatáveis**
- Tabela com colunas: checkbox de seleção, **Título** (com thumbnail + badge "🎁 Resgatável (40.140 pts)" quando aplicável), **Loja** (slug do marketplace), **Preço** (preço atual + preço original riscado), **Cliques** (ícone seta + contador)
- Ações em massa: ativar/desativar, excluir, marcar como resgatável

Cada linha clica para abrir editor lateral/modal com todos os campos da oferta (incluindo `is_redeemable`, `redemption_points`, `is_featured`, `visible_driver`, `driver_only`).

### 3. Tela "Categorias de Achadinhos" (IMG_7023, IMG_7024, IMG_7025, IMG_7026, IMG_7027)

Header **"Categorias de Achadinhos"** + subtítulo "Gerencie as categorias de produtos para filtros no app".

Botão **"+ Nova Categoria"** (largura total, primário).

**Bloco "🎨 Configurações — Detalhe do Achadinho"** (collapsible card):

a) **"🖼 Banners rotativos de fundo"**
   - Texto: "Imagens exibidas atrás da foto do produto com rotação automática. Proporção ideal: 16:9 (1200×675)."
   - Lista de banners (Banner 1, Banner 2…) com:
     - Botão **lixeira** vermelho para remover
     - Botões **"⬆ Enviar"** (upload Storage) e **"🔗 URL"** (colar URL externa)
     - Preview da imagem
     - Botões **"✨ Redesenhar"** (gera nova via Lovable AI), **"⛶ Ajustar"** (crop 16:9), **"🪄 Melhorar"** (upscale via Lovable AI `google/gemini-2.5-flash-image-preview`)
     - Campo de URL editável

b) **"Botão CTA"**
   - Campo **Texto do botão** (default: "Ir para oferta")
   - Campo **Cor de fundo** com color picker + input hex (default `#F97316`)
   - Campo **Cor do texto** com color picker + input hex (default `#FFFFFF`)
   - Botão **"💾 Salvar"** (largura total, primário)
   - Preview do botão renderizado abaixo

Tudo isso é salvo em `brand_settings_json.achadinho_detail_config` da marca atual.

**Lista de categorias** (cards verticais com drag handle invisível para reordenar):
Cada card tem:
- Ícone Lucide colorido em chip arredondado (cor da categoria)
- Nome (ex: Eletrônicos, Moda, Beleza, Ofertas Variadas, Casa, Esportes, Bebê, Pet, Mercado, Livros, Games, Automotivo, Ferramentas)
- Subtítulo "Sem palavras-chave" ou "X palavras-chave" (taxonomia de matching)
- Setas ↑ ↓ para reordenar
- Linha de ações: toggle **Ativo/Inativo** + ícones (lixeira vermelha, banner/imagem da categoria, lápis para editar, lixeira de exclusão)

Modal de edição/criação da categoria com:
- Nome
- Picker de ícone Lucide (search)
- Color picker
- Banner próprio da categoria (Storage)
- Lista de **palavras-chave** (taxonomia) que mapeiam ofertas automaticamente para essa categoria (chips removíveis + input para adicionar)
- Toggle ativo
- Ordem

### 4. Tela "Ubiz Ofertas (Vitrine Pública)"

Página interna do admin que apenas:
- Mostra a URL pública da vitrine da marca
- Botão "Abrir vitrine" (nova aba)
- Botão "Copiar link"
- QR code da URL para compartilhar
- Iframe de preview opcional

### 5. Tela "Espelhamento Achadinho" (IMG_7020, IMG_7021, IMG_7022)

Header: **"Espelhamento de Ofertas"** + subtítulo "Importação automática de ofertas de fontes externas para o Achadinhos".

Banner topo: **"⏰ Período gratuito: 341 dias restantes"** + botão **"Ver planos"** (mostra apenas se a marca está em trial).

Seletor **"Fonte"** (Select) com as opções vindas de `source_catalog` (tabela). Ex:
- **Divulgador Inteligente** (default)
- **Divulga Link**

Bloco **"Onboarding — Primeiros passos do Espelhamento"** (collapsible, com badge `2/4` em amarelo e barra de progresso azul→amarela):
Subtítulo "Siga o passo a passo para importar suas primeiras ofertas."
Passos com checkmark circular verde quando concluídos:
1. **Verificar origens disponíveis** — auto-marca quando `source_catalog` tem ≥1 origem habilitada para a marca. Subtexto: "X origem(ns) liberada(s) pela plataforma para sua marca."
2. **Criar seu primeiro conector** — botão **"Ir para Conectores"** ao lado. Auto-marca quando ≥1 conector existe.
3. **Ativar o conector** — auto-marca quando `is_enabled = true`.
4. **Executar o primeiro sincronismo** — auto-marca quando ≥1 log com `status = success`.

Persistir progresso em `localStorage` com chave `onboarding-mirror-sync-brand-{brandId}` para esconder quando 4/4.

Bloco **KPIs** com a frase "Última sync: DD/MM/AAAA, HH:MM:SS — success" (verde) à esquerda e botão **"🔄 Sincronizar agora"** à direita. Grid 2x2 de cards:
- 📦 **Total Importadas** (azul)
- ✅ **Ativas** (verde)
- 👁 **Visíveis Motorista** (azul) — esconder se a marca não tiver módulo de motorista
- ⚠ **Com Erro** (vermelho)

Tabs:
- **Conectores** (default) — lista de URLs cadastradas
- **Ofertas** — tabela das ofertas espelhadas com filtros por status, origem, categoria
- **Categorias** — diagnóstico de mapeamento (qual categoria cada oferta caiu)
- **Histórico** — logs de sincronização (data, status, lidos, novos, atualizados, ignorados, erros, resumo)
- **Config** — configuração da fonte selecionada (intervalo de auto-sync, filtros padrão, regras de bloqueio)
- **Debug** — testar URL única + ver payload bruto retornado pelo scraper

**Aba Conectores:**
Header "Conectores" + subtítulo "Cadastre uma ou mais URLs por origem. Cada conector roda de forma independente." + botão **"+ Adicionar conector"**.
Cards de conector com:
- Ícone da fonte (Sparkles/Link2)
- Apelido + badge "Ativo"/"Pausado" + badge "Auto-sync"
- Nome da fonte + URL
- Switch ativo/pausado
- Botões: 🔄 Sincronizar, ✏ Editar, 🗑 Remover (com confirmação que avisa que ofertas já importadas permanecem)

Estado vazio: "Nenhum conector cadastrado para 'Divulgador Inteligente'. Clique em **Adicionar conector** para começar."

Modal **"Adicionar/Editar conector"**:
- Select da fonte (preenchido por defaultSourceType)
- Apelido
- URL de origem
- Toggle "Ativar agora"
- Toggle "Auto-sync" + intervalo (a cada 30min / 1h / 6h / 24h)
- Filtros opcionais (categoria default, ativar como visível para motorista, etc.)

### 6. Edge functions necessárias para Espelhamento

a) **`scrape-product`** — recebe `{ url }`, usa Lovable AI Gateway (`google/gemini-2.5-flash`) para extrair `{ title, price, original_price, image_url, store_name }` da página. Para Mercado Livre, Shopee e Amazon, primeiro tenta parser HTML específico; cai pra IA se falhar.

b) **`mirror-sync-divulgador-inteligente`** — recebe `{ brandId, configId }`, busca a URL do conector, faz scraping paginado (chunks de 500), insere/atualiza em `affiliate_deals` com `origin = 'divulgador_inteligente'`, registra em `mirror_sync_logs`. Retorna `{ summary, persisted_new, updated, skipped, errors }`.

c) **`mirror-sync-divulga-link`** — análogo para a fonte Divulga Link.

d) **`mirror-sync-cron`** — roda a cada 30 min, percorre conectores com `auto_sync_enabled = true` e dispara o handler correspondente. Usa `SUPABASE_ANON_KEY` (não a service role) para o cron funcionar.

### 7. Tela "Governança Achadinho"

- Toggle global "Ofertas resgatáveis ativadas para esta marca"
- Regra de pontos por R$ (para calcular `redemption_points` automaticamente)
- Lista de palavras-chave bloqueadas (não importa ofertas que contenham)
- Lista de lojas bloqueadas
- Limite máximo de ofertas ativas simultaneamente
- Auditoria: últimas 50 ações de admin (criou/editou/excluiu/sincronizou) com `user_id`, ação, timestamp e `brand_id`

### 8. Schema adicional (Lovable Cloud)

```text
source_catalog (id, source_key, display_name, icon, is_enabled_globally, default_config_json)
brand_source_entitlements (id, brand_id, source_key, is_enabled)
mirror_sync_configs (id, brand_id, source_type, label, origin_url, is_enabled,
                      auto_sync_enabled, auto_sync_interval_minutes,
                      filters_json, created_at, updated_at)
mirror_sync_logs (id, brand_id, config_id, started_at, finished_at, status,
                   total_read, total_new, total_updated, total_skipped, total_errors,
                   summary, payload_json)
mirrored_deals_link (deal_id, config_id, external_id, sync_status, last_synced_at)
affiliate_deals — adicionar colunas: origin TEXT, is_redeemable BOOL DEFAULT false,
                   redemption_points INT, visible_driver BOOL DEFAULT true,
                   driver_only BOOL DEFAULT false, sync_status TEXT
achadinhos_keywords (id, brand_id, category_id, keyword, weight DEFAULT 1)
achadinhos_governance (brand_id PK, redeemable_enabled, points_per_real,
                        blocked_keywords TEXT[], blocked_stores TEXT[],
                        max_active_deals INT)
achadinhos_audit (id, brand_id, user_id, action, entity_type, entity_id,
                   payload_json, created_at)
```

RLS em todas: leitura/escrita apenas para admin/editor da marca via `has_role(auth.uid(), 'admin', brand_id)`. `source_catalog` legível por authenticated. Updates SEMPRE com `.select()`.

### 9. Performance

- Paginação server-side em todas as listagens grandes (≥100 linhas)
- Edge functions de sync paginadas em chunks de 500
- React Query `staleTime: 60_000` em todas as queries de leitura
- Lazy loading nas imagens de tabela
- Limite de 1000 linhas por query (default Supabase)

### 10. Ordem sugerida

1. Migrations (schema + RLS + seed do `source_catalog` com Divulgador Inteligente e Divulga Link)
2. Sidebar grupo ACHADINHOS + rotas
3. Tela Categorias (CRUD + bloco de configuração de detalhe + palavras-chave)
4. Tela Achadinhos (listagem + busca + filtros + paginação + 3 abas de importação)
5. Tela Espelhamento (KPIs + tabs + onboarding + conectores)
6. Edge functions (`scrape-product`, sync por fonte, cron)
7. Tela Governança Achadinho
8. Tela Ubiz Ofertas (Vitrine Pública)
9. Vincular tudo ao detalhe da oferta na vitrine pública (mostrar badge resgatável, pontos, banners de fundo do detalhe, CTA configurável)

Antes de mexer no código, me confirme o que já existe no projeto e o que precisa ser criado do zero.

---

## (Fim do prompt)

### Notas para você

- O prompt cobre exatamente o que aparece marcado nas screenshots: grupo de menu, tela de listagem com filtro de resgate, categorias com banners + CTA + palavras-chave, espelhamento com onboarding/KPIs/conectores, fontes Divulgador Inteligente e Divulga Link.
- Posso adicionar/remover qualquer bloco antes de você colar (ex: tirar Governança, simplificar Espelhamento para uma fonte só, ou descrever também a aba "Importar Planilha" com mais detalhes).

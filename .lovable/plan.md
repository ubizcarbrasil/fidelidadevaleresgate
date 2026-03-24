

## Módulo de Espelhamento Automático — Achadinhos via Divulgador Inteligente

### Análise da Origem

Inspecionei o site `divulgadorinteligente.com/ubizresgata`. Os dados estão disponíveis diretamente no HTML (sem necessidade de headless browser). Cada card contém:
- Desconto (ex: `-33%`)
- Imagem (URL do Mercado Livre)
- Título do produto
- Preço original e preço atual
- Link interno (ex: `/ubizresgata/p/OQsYd7EvWp`) que redireciona ao destino final

O conector **Firecrawl** já está conectado ao projeto — será usado para scraping.

### Decisão Arquitetural Principal

**Reusar a tabela `affiliate_deals` existente** em vez de criar tabela separada. O DriverMarketplace e todos os componentes de Achadinhos já consomem essa tabela. Criar tabela nova exigiria reescrever dezenas de queries. Em vez disso, adicionarei colunas de metadados de sincronização à tabela existente.

---

### 1. Migração de Banco de Dados

**Adicionar colunas à `affiliate_deals`:**
```sql
ALTER TABLE affiliate_deals ADD COLUMN IF NOT EXISTS origin TEXT DEFAULT 'manual';
ALTER TABLE affiliate_deals ADD COLUMN IF NOT EXISTS origin_external_id TEXT;
ALTER TABLE affiliate_deals ADD COLUMN IF NOT EXISTS origin_url TEXT;
ALTER TABLE affiliate_deals ADD COLUMN IF NOT EXISTS origin_hash TEXT;
ALTER TABLE affiliate_deals ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;
ALTER TABLE affiliate_deals ADD COLUMN IF NOT EXISTS is_flash_promo BOOLEAN DEFAULT false;
ALTER TABLE affiliate_deals ADD COLUMN IF NOT EXISTS visible_driver BOOLEAN DEFAULT true;
ALTER TABLE affiliate_deals ADD COLUMN IF NOT EXISTS sync_status TEXT DEFAULT 'manual';
ALTER TABLE affiliate_deals ADD COLUMN IF NOT EXISTS sync_error TEXT;
ALTER TABLE affiliate_deals ADD COLUMN IF NOT EXISTS raw_payload JSONB;
ALTER TABLE affiliate_deals ADD COLUMN IF NOT EXISTS first_imported_at TIMESTAMPTZ;
ALTER TABLE affiliate_deals ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS idx_affiliate_deals_origin_hash 
  ON affiliate_deals (brand_id, origin_hash) WHERE origin_hash IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_affiliate_deals_origin 
  ON affiliate_deals (brand_id, origin) WHERE origin IS NOT NULL;
```

**Criar tabela de logs de importação:**
```sql
CREATE TABLE mirror_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id),
  origin TEXT NOT NULL DEFAULT 'divulgador_inteligente',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ,
  total_read INT DEFAULT 0,
  total_new INT DEFAULT 0,
  total_updated INT DEFAULT 0,
  total_skipped INT DEFAULT 0,
  total_errors INT DEFAULT 0,
  status TEXT DEFAULT 'running',
  summary TEXT,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE mirror_sync_logs ENABLE ROW LEVEL SECURITY;
```

**Criar tabela de configuração do integrador:**
```sql
CREATE TABLE mirror_sync_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) UNIQUE,
  origin_url TEXT NOT NULL DEFAULT 'https://www.divulgadorinteligente.com/ubizresgata',
  extra_pages TEXT[] DEFAULT '{}',
  auto_sync_enabled BOOLEAN DEFAULT false,
  sync_interval_minutes INT DEFAULT 10,
  max_offers_per_read INT DEFAULT 100,
  max_pages INT DEFAULT 5,
  timeout_seconds INT DEFAULT 30,
  debug_mode BOOLEAN DEFAULT false,
  auto_activate BOOLEAN DEFAULT true,
  auto_visible_driver BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE mirror_sync_config ENABLE ROW LEVEL SECURITY;
```

RLS: policies para brand_admin e root_admin em ambas as tabelas.

---

### 2. Edge Function: `mirror-sync`

Edge function que executa a sincronização. Fluxo:

1. Recebe `brand_id` e opcionalmente `origin_url`
2. Carrega config da `mirror_sync_config`
3. Usa **Firecrawl** para scraper o HTML da página
4. Faz parsing do HTML para extrair os cards de ofertas
5. Para cada oferta:
   - Gera `origin_hash` = MD5(title + price + affiliate_url)
   - Gera `origin_external_id` do slug da URL (ex: `OQsYd7EvWp`)
   - Verifica duplicata pelo hash
   - Se nova: insere em `affiliate_deals` com `origin = 'divulgador_inteligente'`
   - Se existente: atualiza preço/imagem/description se mudaram
6. Registra log em `mirror_sync_logs`
7. Retorna resumo

**Parsing**: O HTML tem estrutura clara — links `<a>` com classe `sc-a1e0a9be-0`, contendo `<span>` de desconto, `<img>` do produto, `<p>` com título e `<p>` com preços. O parser extrairá via regex/DOM patterns.

**Deduplicação**: 3 camadas — `origin_external_id` (slug da URL) → `origin_hash` (título+preço+link) → `affiliate_url` existente.

---

### 3. Cron Job (Sincronização Automática)

Usar `pg_cron` + `pg_net` para chamar a edge function periodicamente, conforme `sync_interval_minutes` da config. Inicialmente configurado como 10 minutos, ajustável pelo admin.

---

### 4. Painel Administrativo — Nova Página `/mirror-sync`

**Rota**: `/mirror-sync` com `ModuleGuard "affiliate_deals"`

**Layout** (3 seções):

**A. Cabeçalho com KPIs:**
- Total importadas | Ativas | Visíveis no Achadinhos | Com erro
- Botão "Sincronizar agora"
- Última sincronização (timestamp + status)
- Toggle de automação ligada/desligada

**B. Tabela de ofertas importadas** (filtro `origin = 'divulgador_inteligente'`):
- Colunas: imagem, título, loja, preço atual, preço antigo, categoria, status, visível, destaque, data
- Filtros: status, loja, categoria, visibilidade, destaque, data
- Ações individuais: ativar/desativar, mostrar/ocultar, destaque, editar, abrir link original
- Ações em lote: ativar, desativar, ocultar, destacar, definir categoria

**C. Histórico de sincronizações** (aba ou seção inferior):
- Tabela com logs da `mirror_sync_logs`: data, totais, status, resumo

---

### 5. Tela de Configuração do Integrador

Dentro da página `/mirror-sync`, aba "Configurações":
- URL da origem
- URLs adicionais
- Intervalo de sincronização
- Limite de ofertas por leitura
- Auto-ativar ofertas importadas
- Auto-visível para motoristas
- Modo debug on/off

---

### 6. Modo Debug

Aba "Debug" na página `/mirror-sync`:
- Último HTML capturado (armazenado em `raw_payload` das últimas ofertas)
- Campos extraídos vs. campos salvos
- Ofertas ignoradas + motivo
- Erros de parsing

---

### 7. Integração com DriverMarketplace

O `DriverMarketplace` já consome `affiliate_deals`. Ajustes mínimos:
- Adicionar filtro `visible_driver = true` na query (ou `eq("visible_driver", true)`)
- Renderizar badge "Destaque" para `is_featured = true`
- Renderizar badge "Relâmpago" para `is_flash_promo = true`
- O restante (cards, categorias, carrosséis) já funciona

---

### 8. Menu no BrandSidebar

Adicionar item "Espelhamento" abaixo de "Achadinhos" no sidebar, com ícone `RefreshCw` e moduleKey `affiliate_deals`.

---

### Resumo de Entregas

| Item | Tipo | Arquivo/Recurso |
|------|------|-----------------|
| Colunas em `affiliate_deals` | Migration | SQL |
| Tabela `mirror_sync_logs` | Migration | SQL |
| Tabela `mirror_sync_config` | Migration | SQL |
| RLS policies | Migration | SQL |
| Edge function `mirror-sync` | Backend | `supabase/functions/mirror-sync/index.ts` |
| Cron job | SQL insert | pg_cron schedule |
| Página `/mirror-sync` | Frontend | `src/pages/MirrorSyncPage.tsx` |
| Rota no App.tsx | Frontend | Linha nova em `App.tsx` |
| Item no BrandSidebar | Frontend | `src/components/consoles/BrandSidebar.tsx` |
| Filtro `visible_driver` no Marketplace | Frontend | `src/components/driver/DriverMarketplace.tsx` |

**Total estimado**: ~5 arquivos novos, ~4 arquivos editados, 1 migration, 1 edge function.


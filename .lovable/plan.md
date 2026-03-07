

## Plano: Banco de Dados CRM Unificado com Eventos de Mobilidade Urbana

### Visão Geral

Preparar a infraestrutura de dados para unificar três fontes de clientes — **app de mobilidade urbana** (corridas), **sistema de fidelidade** (pontos/resgates) e **base própria das lojas** (upload CSV) — em um CRM segmentável com campanhas pagas de disparo em massa.

### Fase 1: Novas Tabelas (Migration SQL)

#### 1.1 `crm_contacts` — Base Unificada de Contatos
Tabela central que consolida dados de todas as fontes. Cada contato pertence a um `brand_id`.

```text
crm_contacts
├── id (uuid PK)
├── brand_id (uuid NOT NULL)
├── branch_id (uuid)
├── customer_id (uuid nullable → FK customers)  -- link com fidelidade
├── external_id (text)  -- ID do app de mobilidade
├── name (text)
├── phone (text)
├── email (text)
├── cpf (text)
├── gender (text)  -- M, F, O
├── os_platform (text)  -- iOS, Android
├── source (text)  -- 'MOBILITY_APP', 'LOYALTY', 'STORE_UPLOAD', 'MANUAL'
├── latitude (numeric)  -- última localização conhecida
├── longitude (numeric)
├── tags_json (jsonb DEFAULT '[]')
├── metadata_json (jsonb DEFAULT '{}')
├── is_active (boolean DEFAULT true)
├── created_at, updated_at
└── UNIQUE(brand_id, external_id), UNIQUE(brand_id, cpf)
```

#### 1.2 `crm_events` — Eventos de Mobilidade + Fidelidade
Armazena todos os eventos recebidos da API de mobilidade e do sistema de fidelidade.

```text
crm_events
├── id (uuid PK)
├── brand_id (uuid NOT NULL)
├── contact_id (uuid FK crm_contacts)
├── event_type (text NOT NULL)
│   Valores: 'USER_REGISTERED', 'RIDE_ESTIMATED', 'RIDE_REQUESTED',
│   'RIDE_STARTED', 'RIDE_COMPLETED', 'RIDE_CANCELLED_PASSENGER',
│   'RIDE_CANCELLED_EXTERNAL', 'RIDE_UNATTENDED', 'RIDE_RATED',
│   'EARNING', 'REDEMPTION', 'OFFER_VIEW', 'OFFER_CLICK'
├── event_subtype (text)  -- ex: 'FIRST_RIDE', '10TH_RIDE', 'RATING_5'
├── latitude (numeric)
├── longitude (numeric)
├── payload_json (jsonb DEFAULT '{}')  -- dados extras do evento
├── created_at (timestamptz DEFAULT now())
```

#### 1.3 `crm_tiers` — Configuração de Tiers
Configurável por brand: faixas de corridas/pontuações que definem cada tier.

```text
crm_tiers
├── id (uuid PK)
├── brand_id (uuid NOT NULL)
├── name (text)  -- 'Galático', 'Lendário', etc.
├── min_events (int)  -- mínimo de eventos para atingir
├── max_events (int)
├── color (text)
├── icon (text)
├── order_index (int)
├── created_at
```

#### 1.4 `crm_audiences` — Públicos Segmentados
Segmentos salvos com filtros para reuso em campanhas.

```text
crm_audiences
├── id (uuid PK)
├── brand_id (uuid NOT NULL)
├── name (text)
├── description (text)
├── filters_json (jsonb)  -- {gender, os, tier, inactivity_days, min_rides, etc.}
├── estimated_count (int DEFAULT 0)
├── created_by (uuid)
├── created_at, updated_at
```

#### 1.5 `crm_campaigns` — Campanhas de Disparo
Gerencia campanhas de envio em massa com aprovação e pagamento.

```text
crm_campaigns
├── id (uuid PK)
├── brand_id (uuid NOT NULL)
├── audience_id (uuid FK crm_audiences)
├── store_id (uuid nullable)  -- loja patrocinadora
├── title (text)
├── message_template (text)  -- com placeholders {nome}, {loja}, {valor}
├── image_url (text)
├── channel (text)  -- 'WHATSAPP', 'PUSH', 'EMAIL', 'IN_APP'
├── cost_per_send (numeric)  -- 0.50 WhatsApp, 0.03 push/email
├── total_cost (numeric DEFAULT 0)
├── total_recipients (int DEFAULT 0)
├── status (text DEFAULT 'DRAFT')
│   Valores: 'DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'PAYMENT_PENDING',
│   'SCHEDULED', 'SENDING', 'SENT', 'CANCELLED'
├── scheduled_at (timestamptz)
├── sent_at (timestamptz)
├── approved_by (uuid)
├── approved_at (timestamptz)
├── offer_config_json (jsonb DEFAULT '{}')
│   -- {giftback_value, min_purchase, validity_days, store_name}
├── created_by (uuid)
├── created_at, updated_at
```

#### 1.6 `crm_campaign_logs` — Log de Envios
Rastreia cada envio individual para auditoria e métricas.

```text
crm_campaign_logs
├── id (uuid PK)
├── campaign_id (uuid FK crm_campaigns)
├── contact_id (uuid FK crm_contacts)
├── channel (text)
├── status (text)  -- 'QUEUED', 'SENT', 'DELIVERED', 'FAILED'
├── sent_at (timestamptz)
├── error_message (text)
├── created_at
```

### Fase 2: Edge Function — Webhook de Eventos de Mobilidade

**`supabase/functions/mobility-webhook/index.ts`** — Recebe lotes de eventos do app de mobilidade, faz upsert em `crm_contacts` e insere em `crm_events`. Autenticação via `MOBILITY_API_SECRET`.

Lógica:
1. Recebe batch de eventos (acumulados pelo app a cada ~1 minuto)
2. Para cada evento: upsert contato por `external_id` (cria se não existe, atualiza lat/lng/nome)
3. Insere evento com tipo, subtipo e payload
4. Retorna confirmação com contagem

### Fase 3: Páginas do CRM no Painel do Empreendedor

#### 3.1 `CrmTierPage.tsx` — Visão por Tiers
Página mostrando distribuição de contatos por tier, com drill-down por tier.

#### 3.2 `CrmAudiencesPage.tsx` — Gestão de Públicos
Criar/editar audiências com filtros: gênero, SO, tier, dias inativos, faixa de corridas, cidade. Mostra contagem estimada em tempo real.

#### 3.3 `CrmCampaignsPage.tsx` — Campanhas de Disparo
Wizard de campanha:
1. Escolher público (audiência salva)
2. Configurar template de mensagem (giftback, compra mínima, validade, loja)
3. Escolher canal (WhatsApp R$0,50 / Push R$0,03 / Email R$0,03)
4. Ver custo total estimado
5. Solicitar aprovação
6. Após aprovação: pagamento e agendamento (dia, hora)
7. Revisão final → Confirmar envio

#### 3.4 `CrmContactsPage.tsx` — Base de Contatos Unificada
Substitui/complementa `CrmCustomersPage` com dados de todas as fontes, filtráveis por origem, tier, gênero, SO.

#### 3.5 `CrmAnalyticsPage.tsx` — Analytics Avançado
Gráficos de: eventos por tipo ao longo do tempo, distribuição por tier, mapa de calor de lat/lng, métricas de corridas vs fidelidade.

### Fase 4: Painel do Lojista (Store Owner)

Adicionar aba no `StoreOwnerPanel`:
- **Perfil dos Clientes**: visão segmentada por gênero e SO dos contatos que resgataram naquela loja
- **Template de Oferta**: configurar giftback padrão, compra mínima, validade
- **Solicitar Campanha**: escolher canal, público, ver custo, enviar para aprovação do brand_admin

### Fase 5: Sidebar e Rotas

Sidebar CRM expandida:
```text
📊 CRM Estratégico
├── Dashboard CRM          /crm
├── Contatos               /crm/contacts
├── Tiers                  /crm/tiers
├── Oportunidades          /crm/opportunities
├── Análise Pareto         /crm/pareto
├── Jornada do Cliente     /crm/journey
├── Públicos               /crm/audiences
├── Campanhas              /crm/campaigns
├── Clientes Perdidos      /crm/lost
├── Clientes Potenciais    /crm/potential
```

### Resumo de Arquivos

| Tipo | Arquivo | Ação |
|------|---------|------|
| Migration | SQL | 6 tabelas + RLS + índices |
| Edge Function | `supabase/functions/mobility-webhook/index.ts` | Criar |
| Hook | `src/hooks/useCrmContacts.ts` | Criar — queries em crm_contacts/crm_events |
| Hook | `src/hooks/useTierStats.ts` | Criar — cálculos de tier |
| Página | `src/pages/CrmContactsPage.tsx` | Criar |
| Página | `src/pages/CrmTierPage.tsx` | Criar |
| Página | `src/pages/CrmAudiencesPage.tsx` | Criar |
| Página | `src/pages/CrmCampaignsPage.tsx` | Criar |
| Página | `src/pages/CrmAnalyticsPage.tsx` | Criar |
| Componente | `src/components/store-owner/StoreCampaignTab.tsx` | Criar |
| Editar | `src/hooks/useCrmAnalytics.ts` | Integrar crm_contacts + crm_events |
| Editar | `src/components/consoles/BrandSidebar.tsx` | Novos itens de menu |
| Editar | `src/App.tsx` | Novas rotas |
| Editar | `src/pages/StoreOwnerPanel.tsx` | Nova aba de campanhas |

### Nota sobre Escopo

Este plano é extenso. Recomendo implementar em 2-3 rodadas:
1. **Rodada 1**: Tabelas + webhook + página de contatos + tiers
2. **Rodada 2**: Audiências + campanhas + painel do lojista
3. **Rodada 3**: Analytics avançado + mapa de calor + integração completa

Posso começar pela Rodada 1 após aprovação.


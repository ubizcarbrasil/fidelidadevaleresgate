

## Análise: O que já existe vs. O que falta

### Já implementado
- **Wizard de auto-cadastro de loja** (4 etapas com persistência de rascunho): dados básicos, endereço, documentos, senha
- **Aprovação de lojas** pelo admin (PENDING_APPROVAL → APPROVED/REJECTED)
- **Painel do lojista** (StoreOwnerPanel): sidebar com 10 menus, Dashboard funcional com KPIs
- **Tabela stores**: campos completos (store_type, cnpj, segment, tags, banner_url, video_url, gallery_urls, description, etc.)
- **Perfil da loja no app cliente** (CustomerStoreDetailPage): exibe ofertas, catálogo, WhatsApp
- **Catálogo digital** (store_catalog_items): CRUD básico
- **Wizard de cupom** existente: 11 passos (tipo, valor, código, título, campanha, filial, agenda, limites, público, termos, revisão) — mas orientado ao modelo antigo de "vouchers com desconto"

### O que falta construir

**1. Perfil da Loja (pós-aprovação, construtor)**
- Página de edição de perfil completo: descrição, imagens de produto, vídeo, vitrine/cardápio, botões WhatsApp/Instagram/GPS
- Construtor de catálogo digital integrado ao perfil

**2. Reimaginar o Wizard de Cupom do Lojista**
O wizard atual (VoucherWizard) é para admin e usa tabela `vouchers`. O novo cupom do lojista precisa:
- **Categoria** do cupom (segmentação)
- **Tipo**: Loja inteira ou Produto específico
- **Valor escalonado**: percentual com até 5 faixas de compra mínima (ex: 20% → R$20 para R$100, R$40 para R$200...)
- **Agendamento prévio** (sim/não + antecedência)
- **Cumulativo** (sim/não)
- **Dias e horários específicos** (múltiplos dias com horários)
- **Período de validade** (liberação e expiração)
- **Restrições e limites** (quantidade, uso por cliente, intervalo entre usos)
- **Termo de aceite** gerado automaticamente com todas as regras
- **Tipo de resgate** (presencial/site/WhatsApp)
- Nova tabela ou extensão da tabela `offers` para suportar esses campos

**3. Módulos do Painel do Lojista (hoje são placeholders)**
- Cupom: listagem + criação com novo wizard
- Resgate de PIN: validação PIN + CPF
- Meu Perfil: editor do perfil público
- Extrato: histórico de resgates e ganhos
- Funcionários: gestão de operadores da loja
- Termos e Uso
- Filiais: se tiver múltiplas
- Tutorial e Suporte

---

## Plano de Implementação

Dado o tamanho massivo desta jornada, proponho dividir em **fases incrementais**:

### Fase 1 — Estrutura de dados para o novo cupom do lojista
1. Migração SQL: adicionar colunas na tabela `offers` para suportar os novos campos:
   - `coupon_type` (STORE / PRODUCT)
   - `coupon_category` text
   - `scaled_values_json` jsonb (array de faixas: [{min_purchase, credit_value}])
   - `requires_scheduling` boolean + `scheduling_advance_hours` int
   - `is_cumulative` boolean
   - `specific_days_json` jsonb (array: [{weekday, start_time, end_time}])
   - `validity_start` / `validity_end` (já existem como start_at/end_at)
   - `max_total_uses` int, `max_uses_per_customer` int, `interval_between_uses_days` int
   - `redemption_type` text (PRESENCIAL / SITE / WHATSAPP)
   - `terms_accepted_at` timestamp, `terms_text` text
   - `product_id` uuid nullable (ref a store_catalog_items para cupom de produto)

2. RLS: herdar políticas existentes de `offers`

### Fase 2 — Novo Wizard de Cupom do Lojista (11 passos)
Criar `StoreVoucherWizard` com os passos descritos:
1. Categoria do cupom
2. Tipo (loja/produto)
3. Configuração de valor (% ou fixo) + escalonamento com até 5 faixas
4. Agendamento prévio
5. Cumulativo
6. Dias e horários específicos
7. Período de validade
8. Restrições e limites
9. Geração automática do Termo de Aceite
10. Tipo de resgate
11. Revisão e criação

### Fase 3 — Painel do Lojista: módulos funcionais
- Integrar o novo wizard no menu "Cupom"
- Implementar listagem de cupons com filtros de status
- Implementar "Resgate de PIN" (validação PIN + CPF)
- Implementar "Meu Perfil" (editor do perfil público da loja)
- Implementar "Extrato" (histórico financeiro)

### Fase 4 — Funcionários, Filiais, Tutorial, Suporte
- Gestão de operadores vinculados à loja
- Suporte a múltiplas filiais do lojista
- Conteúdo de tutorial e canal de suporte

---

**Recomendação**: Começar pela **Fase 1 + Fase 2** (estrutura de dados + wizard de cupom), pois é o núcleo da jornada descrita. Posso implementar ambas agora.


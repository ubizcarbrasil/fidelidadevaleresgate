

# Plano: Importação CSV de Cupons/Vouchers

## Objetivo
Adicionar o tipo **COUPONS** ao importador CSV existente (`CsvImportPage.tsx`), com validação de código único e vinculação automática a campanhas (offers) existentes.

## Mudanças

### 1. Definir campos-alvo para cupons

Novo array `COUPON_FIELDS` com os campos mapeáveis:
- `code` (obrigatório) — código do cupom
- `store_name` / `store_slug` — para resolver `store_id`
- `type` (obrigatório) — PERCENT ou FIXED
- `value` — valor do desconto
- `expires_at` (obrigatório) — data de expiração
- `campaign` — título da oferta/campanha para vincular `offer_id`
- `status` — ACTIVE/INACTIVE (default: ACTIVE)

### 2. Registrar o tipo no sistema

- Adicionar `"COUPONS"` ao union type `ImportType`
- Adicionar entrada no `<Select>` de tipo
- Registrar no `getTargetFields()`
- Permitir download do template CSV

### 3. Validação específica para cupons

Na função `validateMappedRow`, adicionar regras:
- `code` obrigatório, formato `[A-Z0-9]{4,16}`
- `type` deve ser PERCENT ou FIXED
- `value` numérico e positivo
- `expires_at` data válida
- **Validação de código único**: antes da importação, buscar todos os códigos existentes na branch via `supabase.from("coupons").select("code")` e rejeitar duplicatas tanto contra o banco quanto dentro do próprio CSV

### 4. Lógica de importação

No bloco `importMutation`, adicionar branch `importType === "COUPONS"`:

1. Pré-carregar lojas da branch (como OFFERS faz) para resolver `store_name`/`store_slug` → `store_id`
2. Pré-carregar ofertas ativas da branch para vincular `campaign` → `offer_id` (match por título case-insensitive)
3. Pré-carregar códigos existentes para validação de unicidade
4. Inserir row-a-row com tratamento de erro individual
5. Invalidar query cache `["coupons"]` no sucesso

### 5. Arquivo modificado

Apenas `src/pages/CsvImportPage.tsx`:
- ~30 linhas novas para `COUPON_FIELDS` + validação
- ~50 linhas novas para lógica de importação de cupons
- ~5 linhas para registrar no Select e getTargetFields

### Resultado Esperado
- Novo tipo "Cupons" no dropdown de importação
- Validação de formato de código + unicidade (banco + intra-CSV)
- Vinculação automática a ofertas/campanhas por título
- Auto-resolve store por nome/slug
- Template CSV baixável com colunas corretas


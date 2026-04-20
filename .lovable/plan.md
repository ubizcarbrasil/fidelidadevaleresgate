

# Modelos de Negócio como Add-ons Avulsos (Sub-fase 6.1)

## Conceito

Hoje você vende **planos** (Free/Starter/Profissional/Enterprise) que liberam pacotes fixos de modelos. A nova camada permite vender **modelos individuais** como add-on, em cima de qualquer plano. Exemplo: cliente está no Starter mas compra "Duelo Motorista" e "Achadinhos Cliente" avulsos.

**Resultado:** o empreendedor vê os modelos liberados pelo plano + os modelos comprados avulsos, sem distinção visual no painel dele. A diferença fica só no Raiz (você sabe o que veio de cada fonte e cobra separado).

## Os 10 modelos que você listou já existem no banco

| Você pediu | Já cadastrado como |
|---|---|
| Cliente — Resgate em parceiros | `resgate_pontos_cliente` |
| Cliente — Compre com pontos (próprios) | `pontua_cliente` |
| Cliente — Achadinhos | `achadinho_cliente` |
| Cliente — Ganha-Ganha | `ganha_ganha` (b2b) |
| Motorista — Resgate em parceiros | `resgate_pontos_motorista` |
| Motorista — Compre com pontos | `pontua_motorista` |
| Motorista — Duelo | `duelo_motorista` |
| Motorista — Aposta | `aposta_motorista` |
| Motorista — Achadinhos | `achadinho_motorista` |
| Motorista — Mercado Livre | `rank_motorista` (renomear para "Mercado Livre Motorista") |

**Não precisa criar modelos novos.** Só ajustar nome do `rank_motorista` e adicionar a camada de venda.

## Arquitetura

```text
┌─────────────────────────────────────────────────────┐
│  PLANO (Starter)                                    │
│  └─ libera: 5 modelos (via plan_business_models)   │
└─────────────────────────────────────────────────────┘
                       +
┌─────────────────────────────────────────────────────┐
│  ADD-ONS AVULSOS                                    │
│  └─ Brand X comprou: "Duelo" + "Achadinhos Cli"    │
│     (via brand_business_model_addons — NOVO)       │
└─────────────────────────────────────────────────────┘
                       ↓
            UNIÃO: 7 modelos liberados
            (entram em brand_business_models)
```

## O que vai ser criado

### 1. Banco — 2 colunas + 1 tabela nova

**`business_models` ganha:**
- `is_sellable_addon BOOLEAN DEFAULT false` — marca quais modelos podem ser vendidos avulsos (você decide quais dos 13)
- `addon_price_monthly_cents INTEGER` — preço mensal do add-on (R$ × 100)
- `addon_price_yearly_cents INTEGER` — preço anual com desconto

**Nova tabela `brand_business_model_addons`:**
| Coluna | Tipo | Função |
|---|---|---|
| brand_id | uuid | qual marca comprou |
| business_model_id | uuid | qual modelo |
| status | text | `active` / `cancelled` / `past_due` |
| billing_cycle | text | `monthly` / `yearly` |
| price_cents | integer | snapshot do preço cobrado |
| activated_at | timestamptz | quando virou ativo |
| expires_at | timestamptz | fim do ciclo (null = vitalício/manual) |
| created_by | uuid | quem ativou (Root Admin ou Stripe) |
| notes | text | motivo (cortesia, trial, vendido, etc.) |

UNIQUE `(brand_id, business_model_id)` — não duplica add-on da mesma marca.

### 2. RPC `resolve_active_business_models` — atualizada

Hoje retorna: modelos do plano ∩ modelos ativados pela brand.
Vai passar a retornar: **(modelos do plano) ∪ (add-ons ativos da brand)**, ambos disponíveis para a brand ativar/desativar.

A flag de origem (`source: "plan" | "addon"`) volta no payload, mas só o Raiz usa — empreendedor não vê diferença.

### 3. UI Raiz — Central de Módulos ganha 2 coisas

**a) Aba "Catálogo de Modelos" (existente):** cada linha ganha 3 campos novos:
- Toggle "Vendável como add-on"
- Input "Preço mensal (R$)"
- Input "Preço anual (R$)"

**b) Nova aba "Add-ons Vendidos":** lista de todos os add-ons ativos por marca, com filtros (marca, modelo, status). Ações:
- Conceder add-on manualmente (cortesia/trial)
- Cancelar add-on
- Editar ciclo/preço
- Ver histórico

### 4. UI Painel Empreendedor — apenas 1 mudança visual

Na aba "Modelos de Negócio" do painel da brand, modelos vindos de **add-on** ganham um badge discreto "Add-on" (cor diferente do "Plano"). Isso deixa claro o que ele paga separado. Toggle de ativação funciona igual para os dois.

### 5. NÃO incluído nesta sub-fase

- Checkout self-service do empreendedor (ele compra add-on sozinho)
- Cobrança automática via Stripe
- Trial automático

Esses ficam para 6.2/6.3. Por ora, **só Raiz concede manualmente** — replica o padrão de `manual-subscription-management` que já existe.

## Arquivos a criar/editar

| Arquivo | Ação |
|---|---|
| `supabase/migrations/<nova>.sql` | 3 colunas em `business_models` + tabela `brand_business_model_addons` + RLS + atualizar RPC `resolve_active_business_models` |
| `src/features/central_modulos/components/secao_catalogo_modelos.tsx` | adicionar toggle "vendável" e inputs de preço |
| `src/features/central_modulos/components/secao_addons_vendidos.tsx` | **novo** — lista + filtros + ações |
| `src/features/central_modulos/components/dialog_conceder_addon.tsx` | **novo** — modal de concessão manual |
| `src/features/central_modulos/components/aba_modelos_negocio.tsx` | adicionar 4ª sub-aba "Add-ons Vendidos" |
| `src/compartilhados/hooks/hook_business_model_addons.ts` | **novo** — CRUD + lista |
| `src/compartilhados/hooks/hook_modelos_negocio_resolvidos.ts` | passar a expor `source` no retorno |
| `src/features/painel_modelos_negocio/components/card_modelo_brand.tsx` | badge "Add-on" quando `source === "addon"` |
| `src/components/manuais/dados_manuais.ts` | novo manual "Como vender modelos avulsos" |

## Riscos e rollback

- **Risco:** baixo. Add-ons são aditivos — se a tabela vier vazia, comportamento é idêntico ao atual.
- **Compatibilidade:** RPC continua retornando o mesmo formato; só ganha o campo `source`.
- **Rollback:** `DROP TABLE brand_business_model_addons` + `ALTER TABLE business_models DROP COLUMN is_sellable_addon, addon_price_monthly_cents, addon_price_yearly_cents` + reverter RPC. Brands voltam ao estado "só plano".

## Estimativa
~25 min. Commit atômico único. `npx tsc --noEmit` esperado limpo.

## Dúvidas antes de implementar

1. Os **3 modelos b2b/cliente** que você não listou (`resgate_cidade_cliente`, `cinturao_motorista`, `resgate_cidade_motorista`) também ficam vendáveis como add-on, ou só os 10 da sua lista?
2. O preço deve aceitar **ciclo anual** com desconto, ou por enquanto só **mensal**?
3. Quer que eu já renomeie `rank_motorista` para "Mercado Livre Motorista" nessa migração?


# Arquitetura — Fidelidade + Resgate (core)

Documentação técnica do produto **Fidelidade + Resgate** (loyalty/redemption core)
do projeto `fidelidadevaleresgate` — multi-tenant SaaS hosteado no Lovable + Supabase.

## Por que essa doc existe

O projeto cresceu como monolito misturando 5 produtos (loyalty, CRM, motorista,
campeonato, achadinho). Pra futuro rebuild/extração de produto isolado ou
onboarding de novo dev, esta documentação cataloga TUDO que pertence ao núcleo
**loyalty/redeem** — desde o schema do banco até as telas e regras de negócio.

## Escopo

**INCLUÍDO** (este produto):
- Cadastro de clientes, brands, branches
- Programa de pontos (regras, ledger, ganho via PDV/webhook)
- Resgate (ofertas, vouchers, redemptions)
- Storefront público de cliente (`/c/*`)
- Onboarding de tenant/brand

**EXCLUÍDO** (produtos vizinhos):
- Campeonato de motoristas (`/campeonato`, `src/products/campeonato/`)
- Painel motorista (`/driver`, `/motorista/*`)
- CRM (foi migrado pra app externo via iframe — `CrmEmbedPage`)
- Achadinho/affiliate como produto (admin de affiliates) — incluso só onde toca
  o redeem flow do customer
- Mirror-sync (deal aggregator de fontes externas)

## Stack

- **Frontend**: Vite + React 18 + TypeScript + Tailwind + shadcn/ui + React Query + React Router
- **Backend**: Supabase (Postgres + Auth + Storage + Edge Functions Deno)
- **PWA**: Workbox + manifest dinâmico por brand
- **Hosting**: Lovable

## Estrutura desta documentação

| Fase | Arquivo | Conteúdo |
|---|---|---|
| 1 | [`01-inventario.md`](./01-inventario.md) | Catálogo completo: páginas, componentes, hooks, edge functions, RPCs, integrações |
| 2 | [`02-arquitetura.md`](./02-arquitetura.md) | Diagramas (ASCII + Mermaid): C4, fluxo de dados, autenticação, multi-tenancy |
| 3 | [`03-modelagem-banco.md`](./03-modelagem-banco.md) | DDL completo: 24 tabelas core com `CREATE TABLE`, FKs, índices, RLS policies |
| 4 | [`04-regras-de-negocio.md`](./04-regras-de-negocio.md) | Regras catalogadas: pontuação, resgate, tiers, expiração, validações |
| 5 | [`05-mapeamento-telas.md`](./05-mapeamento-telas.md) | Por tela: objetivo, componentes, campos, eventos, APIs consumidas, validações |

## Convenções

- **Idioma**: comentários em pt-BR, código em inglês
- **Multi-tenancy**: TODA tabela tem `brand_id` (FK); RLS via `campeonato_admin_can_manage(brand_id)` ou helper similar
- **Identificação de cliente**: `customers.id` (UUID) — separado de `auth.users.id` (admin)
- **Ledger pattern**: `points_ledger` é immutable append-only. Saldo materializado em `customers.points_balance`
- **Datas**: TODAS storage em UTC (`timestamptz`). Exibição/cálculo de business day usa `America/Sao_Paulo` via helpers em `src/lib/dateTz.ts`
- **Decimal**: pontos como `integer`, valores monetários como `numeric(12,2)`

## Glossário

| Termo | Significado |
|---|---|
| **Tenant** | Empresa que opera o SaaS (root). Geralmente 1 só. |
| **Brand** | Marca cliente (white-label) — cada cliente do SaaS é uma brand |
| **Branch** | Cidade/filial dentro de uma brand. Multi-cidade por brand. |
| **Customer** | Cliente final que ganha/resgata pontos. Identificado por CPF dentro de uma brand. |
| **Store** | Loja parceira que aceita/emite pontos |
| **Offer** | Oferta resgatável (cliente troca pontos por desconto/produto) |
| **Voucher** | Código promocional com regra própria (% off, valor fixo, etc) |
| **Earning event** | Evento de ganho de pontos (compra registrada) |
| **Redemption** | Resgate de oferta (cliente trocou pontos) |
| **Points ledger** | Log imutável de entrada/saída de pontos |
| **Tier** | Nível do cliente (INICIANTE, BRONZE, PRATA, OURO, GALÁTICO) que multiplica taxa de pontos |
| **GanhaGanha** | Sub-produto: programa de pontos próprio da brand vendido pra lojas |

## Atualização desta doc

Ao adicionar tabela/RPC/edge function no escopo loyalty/redeem:
1. Adicionar entry em [`01-inventario.md`](./01-inventario.md)
2. Atualizar DDL em [`03-modelagem-banco.md`](./03-modelagem-banco.md)
3. Se mudar regra de negócio, atualizar [`04-regras-de-negocio.md`](./04-regras-de-negocio.md)
4. Se for nova tela, adicionar em [`05-mapeamento-telas.md`](./05-mapeamento-telas.md)

Última atualização: 2026-06-02 (auditoria CTO completa, 12 PRs entregues).

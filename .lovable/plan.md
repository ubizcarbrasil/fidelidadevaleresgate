

## Cardápio Digital — Plano de Implementação

### Situação Atual

Já existe:
- Tabela `store_catalog_items` (id, store_id, name, description, price, image_url, is_active, order_index)
- Módulo `catalog` registrado em `module_definitions` (categoria: comercial)
- `StoreCatalogPage` para admin gerenciar itens
- Seção de catálogo básica no `CustomerStoreDetailPage` (grid simples de produtos)
- `StoreVoucherWizard` já consulta `store_catalog_items` para vincular produto a ofertas
- Campo `store_type` (RECEPTORA/EMISSORA/MISTA) e `points_per_real` na tabela `stores`
- Campo `whatsapp` na tabela `stores`

### O Que Falta (Escopo da Feature)

A feature envolve 5 frentes:

---

### 1. Schema — Evolução do Catálogo

Adicionar à tabela `store_catalog_items`:
- `category` (text, nullable) — agrupar itens em categorias (ex: "Pizzas", "Bebidas")
- `brand_id` (uuid, NOT NULL, FK → brands) — para RLS e scoping
- `branch_id` (uuid, NOT NULL, FK → branches) — seguindo a regra arquitetural

Criar tabela `store_catalog_categories`:
- `id`, `store_id`, `name`, `order_index`, `image_url`, `is_active`, `created_at`

Criar tabela `catalog_cart_orders` (log de pedidos enviados ao WhatsApp):
- `id`, `store_id`, `customer_id` (nullable), `brand_id`, `branch_id`
- `items_json` (jsonb — snapshot dos itens, qtd, preço)
- `total_amount` (numeric)
- `points_earned_estimate` (integer)
- `whatsapp_url_sent` (text)
- `created_at`

RLS: leitura pública de itens ativos; gestão pelo dono da loja (store_admin) e admins de brand/branch.

---

### 2. Regra de Pontos do Catálogo

- O catálogo só aparece para lojas com `store_type` = `EMISSORA` ou `MISTA`
- Cada R$1 gasto gera por padrão 1 ponto (valor mínimo fixo, não pode ser reduzido pelo lojista)
- O lojista pode aumentar `points_per_real` (já existe esse campo) mas nunca abaixo de 1
- No `StoreOwnerPanel`, adicionar validação: campo `points_per_real` com `min=1`

---

### 3. Portal do Parceiro — Gestão do Catálogo

Adicionar tab "Catálogo" no `StoreOwnerPanel` (visível apenas se `store_type !== 'RECEPTORA'`):
- CRUD de categorias (drag-to-reorder)
- CRUD de itens com upload de imagem, preço, descrição
- Preview mobile inline do cardápio
- Configuração de layout do cardápio (cores, banner de destaque)
- Armazenar config visual em `store_catalog_config_json` (novo campo na tabela `stores`)

---

### 4. App do Cliente — Cardápio Digital Completo

No `CustomerStoreDetailPage`, substituir o grid simples por uma experiência completa:

**Aba "Catálogo"** (tab ao lado de "Ofertas"):
- Hero banner com logo da loja + destaque de pontos: "Ganhe X pontos por R$1 gasto"
- Navegação por categorias (scroll horizontal de chips)
- Grid de produtos com imagem, nome, preço e botão "+"
- Carrinho flutuante (FAB no canto inferior) com badge de quantidade
- Drawer do carrinho com:
  - Lista de itens, +/- quantidade, preço subtotal
  - Resumo de pontos estimados (total × points_per_real)
  - Destaque visual: "Você vai ganhar **X pontos** neste pedido!"
  - Botão "Enviar pedido pelo WhatsApp"

**Checkout via WhatsApp:**
- Ao confirmar, gera mensagem formatada com:
  - Nome do cliente (se logado)
  - Lista de itens (nome × qtd = R$)
  - Total
  - Pontos estimados
- Abre `wa.me/{whatsapp}?text={mensagem_encoded}`
- Salva registro em `catalog_cart_orders` para tracking

---

### 5. Destaque de Pontos (Fator de Atração)

Em todos os cards de produto, exibir embaixo do preço:
- Badge: "🎯 Ganhe X pts" (calculado: price × points_per_real)
- No carrinho, totalizar: "Este pedido rende Y pontos!"
- Usar cores da marca (primary) para destacar visualmente

---

### Arquivos a Criar/Modificar

**Criar:**
- `src/components/customer/StoreCatalogView.tsx` — página completa do catálogo (categorias, grid, carrinho)
- `src/components/customer/CatalogCartDrawer.tsx` — drawer do carrinho com resumo e checkout WhatsApp
- `src/components/store-owner/StoreCatalogTab.tsx` — gestão do catálogo no portal do parceiro

**Modificar:**
- `src/pages/customer/CustomerStoreDetailPage.tsx` — adicionar tabs (Ofertas | Catálogo)
- `src/pages/StoreOwnerPanel.tsx` — adicionar tab "Catálogo" (condicional a store_type)
- `store_catalog_items` — adicionar colunas category, brand_id, branch_id
- Migrations para novas tabelas e colunas

---

### Resumo das Regras de Negócio

| Regra | Detalhe |
|-------|---------|
| Acesso ao catálogo (lojista) | Apenas EMISSORA ou MISTA |
| Pontos mínimos | 1 ponto por R$1 (nunca abaixo) |
| Pontos máximos | Lojista pode aumentar livremente |
| Checkout | WhatsApp com resumo completo |
| Pontos no card | Exibido em cada item e no total do carrinho |
| Módulo | Protegido pelo module `catalog` |


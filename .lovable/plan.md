

## Plano: Catálogo Profissional com Pedidos Pendentes e Pontuação

### Resumo

Transformar o catálogo digital em uma experiência completa de pedidos com: banners de ofertas, controle de meia porção e quantidade, checkout via WhatsApp com dados do cliente (CPF + nome), sistema de pedidos pendentes no painel do parceiro, e rótulo/ícone personalizável da aba "Catálogo".

---

### 1. Banco de Dados — Migrações

| Tabela | Alteração |
|---|---|
| `customers` | Adicionar coluna `cpf TEXT` |
| `catalog_cart_orders` | Adicionar colunas: `status TEXT DEFAULT 'PENDING'`, `customer_name TEXT`, `customer_cpf TEXT`, `points_confirmed_at TIMESTAMPTZ`, `confirmed_by_user_id UUID`, `notes TEXT` |
| `stores` | O campo `store_catalog_config_json` já existe — será usado para armazenar `{ "tab_label": "Cardápio", "tab_icon": "utensils" }` |
| `store_catalog_items` | Adicionar coluna `allow_half BOOLEAN DEFAULT false`, `half_price NUMERIC` (preço da meia porção) |

Políticas RLS:
- `catalog_cart_orders`: permitir UPDATE pelo store owner (confirmar pontuação) e pelo admin
- Realtime: habilitar para `catalog_cart_orders` para notificações em tempo real

---

### 2. Rótulo/Ícone Personalizável da Aba

**Onde:** `store_catalog_config_json` na tabela `stores`

O parceiro define no painel (`StoreProfileTab` ou `StoreCatalogTab`):
- `tab_label`: "Cardápio", "Loja", "Serviços", etc.
- `tab_icon`: nome do ícone Lucide (utensils, store, briefcase, etc.)

**No app do cliente** (`CustomerStoreDetailPage`): a aba lê `store.store_catalog_config_json` e exibe o ícone/nome configurado em vez de "Catálogo" fixo.

---

### 3. Meia Porção e Controle de Quantidade

**Arquivos:** `StoreCatalogView.tsx`, `CatalogCartDrawer.tsx`

- Itens com `allow_half = true` mostram botão "Meia" ao adicionar ao carrinho
- O `CartItem` ganha campo `is_half: boolean`
- O preço da meia é `half_price` (ou `price / 2` como fallback)
- Na mensagem do WhatsApp: `• Pizza Calabresa (MEIA) ×1 = R$ 25,00`

---

### 4. Banners de Ofertas no Catálogo

**Arquivo:** `StoreCatalogView.tsx`

- Buscar ofertas ativas da loja (`offers` where `store_id` and `status = ACTIVE`)
- Exibir como carrossel horizontal no topo do catálogo (antes do search)
- Ao clicar, abre o detalhe da oferta (reusa `onOfferClick` do pai)

---

### 5. Checkout WhatsApp com CPF e Nome

**Arquivos:** `CatalogCartDrawer.tsx`, `CustomerContext.tsx`

- Se o cliente não tem CPF cadastrado, mostrar campo para preencher antes de enviar
- Ao enviar: salvar CPF no registro do customer (se novo)
- Mensagem WhatsApp inclui: nome, CPF, itens, total, pontos estimados
- Registro no `catalog_cart_orders` inclui `customer_name`, `customer_cpf`, `status: 'PENDING'`

---

### 6. Pedidos Pendentes no Painel do Parceiro

**Novo arquivo:** `src/components/store-owner/StoreOrdersTab.tsx`

- Lista pedidos com status `PENDING` da loja
- Card com: nome do cliente, CPF, itens, total, pontos estimados, data
- Botão **"Confirmar Pontuação"** que:
  1. Atualiza `catalog_cart_orders.status = 'CONFIRMED'` + `points_confirmed_at` + `confirmed_by_user_id`
  2. Insere registro no `earning_events` com os pontos correspondentes
  3. Atualiza `customers.points_balance`
  4. Insere no `points_ledger`

**Integração:** Adicionar aba "Pedidos" no `StoreOwnerPanel` com badge de contagem de pendentes.

---

### 7. Arquivos Modificados

| Arquivo | Mudança |
|---|---|
| `src/components/customer/StoreCatalogView.tsx` | Banners de oferta, suporte meia porção, prop onOfferClick |
| `src/components/customer/CatalogCartDrawer.tsx` | Campo CPF, flag meia, dados no WhatsApp e no insert |
| `src/pages/customer/CustomerStoreDetailPage.tsx` | Aba com label/ícone dinâmico, pass onOfferClick ao catálogo |
| `src/contexts/CustomerContext.tsx` | Expor método para atualizar CPF |
| `src/components/store-owner/StoreCatalogTab.tsx` | Campos para configurar tab_label e tab_icon |
| **NOVO** `src/components/store-owner/StoreOrdersTab.tsx` | Painel de pedidos pendentes com confirmação de pontuação |
| `src/pages/StoreOwnerPanel.tsx` | Adicionar aba/rota Pedidos |
| Migration SQL | Colunas novas em customers, catalog_cart_orders, store_catalog_items |

### Detalhes Técnicos

- O CPF será validado com regex simples (11 dígitos) antes do envio
- A confirmação de pontuação usará uma transação lógica: update order → insert earning_event → update points_balance
- O `store_catalog_config_json` é lido com fallback: `config?.tab_label || "Catálogo"` e `config?.tab_icon || "ShoppingBag"`
- Os ícones Lucide serão renderizados dinamicamente usando um mapa de componentes (mesmo padrão já usado no projeto)


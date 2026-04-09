

# Pacotes de Pontos — Modelo de Comercialização

## Resumo
Criar um sistema onde o Empreendedor (BRAND) define pacotes de pontos com preço fixo (ex: "5.000 pts por R$ 50,00"), e o Franqueado (BRANCH) pode comprar esses pacotes diretamente pelo seu painel, creditando pontos na carteira da cidade.

## Estrutura

### 1. Nova tabela: `points_packages`
Armazena os pacotes criados pelo empreendedor:
- `id`, `brand_id`, `name` (ex: "Pacote Básico"), `points_amount` (quantidade de pontos), `price_cents` (preço em centavos R$), `description`, `is_active`, `sort_order`, `created_at`, `updated_at`

### 2. Nova tabela: `points_package_orders`
Registra cada compra de pacote pelo franqueado:
- `id`, `package_id`, `branch_id`, `brand_id`, `points_amount`, `price_cents`, `status` (PENDING, CONFIRMED, CANCELLED), `purchased_by` (user_id), `confirmed_by` (user_id, nullable), `created_at`, `confirmed_at`

### 3. Página do Empreendedor: Gerenciar Pacotes (`/points-packages`)
- Listagem de pacotes criados (cards com nome, pontos, preço, status ativo/inativo)
- Botão para criar novo pacote (dialog com nome, pontos, preço, descrição)
- Edição e ativação/desativação inline
- Histórico de compras realizadas pelos franqueados (tabela com status, cidade, data)
- Ação de confirmar/cancelar pedidos pendentes (ao confirmar, credita pontos na carteira da cidade)

### 4. Página do Franqueado: Loja de Pacotes (`/points-packages-store`)
- Vitrine de pacotes disponíveis (cards visuais com nome, pontos, preço)
- Botão "Comprar" que cria um pedido com status PENDING
- Histórico dos meus pedidos (status do pedido)

### 5. Navegação
- **BrandSidebar**: Novo item "Pacotes de Pontos" no grupo "Cidades" com ícone `Package`
- **BranchSidebar**: Novo item "Comprar Pontos" no grupo "Motoristas & Resgate" com ícone `ShoppingCart`

### 6. Fluxo de confirmação
Quando o empreendedor confirma um pedido:
- Atualiza `points_package_orders.status` para CONFIRMED
- Credita os pontos na `branch_points_wallet` (balance + total_loaded)
- Insere transação em `branch_wallet_transactions` (tipo LOAD, descrição referenciando o pacote)

### 7. RLS
- Brand admins podem CRUD nos pacotes da sua marca
- Branch admins podem SELECT pacotes ativos da marca e INSERT/SELECT seus próprios pedidos
- Confirmação de pedidos restrita ao brand admin

### Arquivos criados/alterados
- **Migration SQL**: 2 tabelas + RLS policies
- `src/pages/PacotesPontosPage.tsx` — gestão de pacotes (empreendedor)
- `src/pages/LojaPacotesPontosPage.tsx` — vitrine + compra (franqueado)
- `src/components/consoles/BrandSidebar.tsx` — novo item de menu
- `src/components/consoles/BranchSidebar.tsx` — novo item de menu
- `src/App.tsx` — novas rotas


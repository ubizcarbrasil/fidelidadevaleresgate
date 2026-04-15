

## Compra de Pontos pelo Motorista

### Contexto atual
- Já existe um sistema de **Pacotes de Pontos** (`points_packages`) usado para cidades comprarem pontos do empreendedor.
- O painel do motorista já tem a flag `enable_points_purchase` no `branch_settings_json`, mas ela só controla a visibilidade da seção "Compre com Pontos" (produtos resgatáveis).
- Não existe ainda: preço por milheiro configurável pelo empreendedor, nem tela de compra de pontos no app do motorista.

### O que será feito

**1. Banco de dados — nova tabela e configuração**

- Criar tabela `driver_points_purchase_config` com:
  - `brand_id` (FK), `price_per_thousand_cents` (integer — preço do milheiro em centavos), `min_points` (default 1000), `max_points` (default 300000), `is_active` (boolean)
  - RLS: leitura pública (motorista anônimo precisa ver), escrita somente para admins autenticados
- Criar tabela `driver_points_orders` para registrar os pedidos:
  - `id`, `brand_id`, `branch_id`, `customer_id` (motorista), `points_amount`, `price_cents`, `status` (PENDING/CONFIRMED/CANCELLED), `created_at`, `confirmed_at`
  - RLS: leitura pública filtrada por `customer_id`, inserção pública

**2. Painel do Empreendedor — Configuração do preço**

- Nova página/seção acessível pelo sidebar (dentro do grupo de Motoristas ou Pontos):
  - Campo para definir o **valor do milheiro** (ex: R$ 70,00 = 70_00 cents)
  - Mínimo e máximo de pontos por compra
  - Toggle ativar/desativar
- Listagem de pedidos de compra de pontos feitos pelos motoristas, com botão de confirmar (crédito manual)

**3. App do Motorista — Tela "Comprar Pontos"**

- Novo botão no `QuickActionCards` e/ou `DriverHomePage`: "Comprar Pontos" (ícone Coins)
- Tela de compra (overlay) inspirada na imagem enviada:
  - Seletor "Pra mim" (pré-selecionado, motorista logado)
  - Input de quantidade de pontos com botões rápidos (+1.000, +10.000, +50.000)
  - Validação min/max
  - Cálculo automático do valor: `(pontos / 1000) * preço_milheiro`
  - Botão "Continuar compra" → cria o pedido na tabela `driver_points_orders` com status PENDING
  - Toast de sucesso: "Pedido enviado! Aguarde confirmação."

**4. Flag de ativação por cidade**

- Adicionar novo toggle `enable_driver_points_purchase` no `constantes_toggles.ts` para controle granular por cidade
- O botão "Comprar Pontos" só aparece se a config existir e estiver ativa, e se a cidade tiver a flag ligada

### Arquivos principais

| Área | Arquivos |
|------|----------|
| Banco | Migration: `driver_points_purchase_config`, `driver_points_orders` |
| Admin | Nova feature em `src/features/compra_pontos_motorista/` |
| Driver | `QuickActionCards.tsx`, `DriverHomePage.tsx`, `DriverPanelPage.tsx`, novo overlay de compra |
| Config cidade | `constantes_toggles.ts` |

### Resultado esperado
- Empreendedor define preço do milheiro no painel
- Motorista vê botão "Comprar Pontos" no app → escolhe quantidade → envia pedido
- Empreendedor vê pedido pendente → confirma → pontos creditados


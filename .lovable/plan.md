

# Corrigir Resgate na Cidade e Pontos Zerados no Marketplace do Motorista

## Problema 1 — Resgate na Cidade não abre
O `onClickOferta` no `DriverMarketplace.tsx` está apenas fazendo `console.log` sem abrir nenhuma tela de detalhe.

## Problema 2 — Pontos zerados na Loja de Resgate (Ver todos)
O `DriverRedeemStorePage.tsx` usa `useCustomer()` do `CustomerContext` para obter o saldo de pontos. Porém, o painel do motorista usa login via CPF (`DriverSessionContext`), sem sessão Supabase Auth. Resultado: `customer` é `null` e o saldo aparece como `0 pts`.

---

## Alterações

### 1. `src/components/driver/DriverRedeemStorePage.tsx`
- **Substituir** `useCustomer()` por `useDriverSession()` para obter o saldo correto do motorista logado via CPF
- Importar `useDriverSession` no lugar de `useCustomer`
- Usar `driver?.points_balance || 0` em vez de `customer?.points_balance || 0`

### 2. `src/components/driver/DriverRedeemOrderHistory.tsx`
- **Substituir** `useCustomer()` por `useDriverSession()` para garantir que o histórico de resgates também funcione
- Usar `driver?.id` em vez de `customer?.id`

### 3. `src/components/driver/DriverMarketplace.tsx`
- **Adicionar estado** `selectedCityOffer` para controlar a oferta de cidade selecionada
- **Criar componente inline ou modal** de detalhe da oferta da cidade (nome da loja, logo, crédito, pontos necessários, endereço) — somente visualização, sem gerar PIN
- **Substituir** o `console.log` no `onClickOferta` por `setSelectedCityOffer(oferta)`

### 4. `src/components/driver/CityOfferDetailOverlay.tsx` (novo arquivo)
- Overlay full-screen com detalhes da oferta de cidade:
  - Logo/imagem da loja
  - Nome da loja e título da oferta
  - Valor do crédito (R$)
  - Custo em pontos
  - Compra mínima (se houver)
  - Botão de voltar
- Sem fluxo de resgate/PIN — apenas informativo conforme solicitado

## Arquivos afetados

| Arquivo | Ação |
|---------|------|
| `src/components/driver/DriverRedeemStorePage.tsx` | Trocar `useCustomer` por `useDriverSession` |
| `src/components/driver/DriverRedeemOrderHistory.tsx` | Trocar `useCustomer` por `useDriverSession` |
| `src/components/driver/DriverMarketplace.tsx` | Adicionar estado e handler para oferta de cidade |
| `src/components/driver/CityOfferDetailOverlay.tsx` | Novo componente de detalhe da oferta |


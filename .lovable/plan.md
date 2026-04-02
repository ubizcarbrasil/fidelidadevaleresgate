

# Histórico de Resgates na Cidade (Motorista) + Correção da Visibilidade na Loja

## Problemas Identificados

### 1. Motorista não tem histórico de resgates na cidade
O `DriverRedeemOrderHistory` mostra apenas pedidos de produtos (`product_redemption_orders`). Resgates de ofertas na cidade (tabela `redemptions`) não aparecem em lugar nenhum no painel do motorista.

### 2. Resgate não aparece na loja ("Aguardando Baixa" vazio)
O resgate PIN `310391` existe com status `PENDING` e pertence à loja correta (`store_id = d24ec85a`). A RPC `rpc_get_store_owner_redemptions` usa `auth.uid()` para validar — se o lojista estava logado corretamente, o resgate deveria aparecer. Possíveis causas:
- Sessão auth expirada no momento da consulta
- Cache do React Query não atualizado

### 3. PIN + CPF inválidos na busca manual
O CPF digitado (`15716652697`) **não corresponde** ao CPF do resgate (`36193801634`). O sistema funciona corretamente — o CPF inserido estava errado. Porém, como o resgate deveria aparecer na lista "Aguardando Baixa" (sem precisar buscar por PIN+CPF), isso indica que o problema 2 é o real bloqueio.

## Plano de Implementação

### 1. Criar componente de Histórico de Resgates na Cidade para o motorista
Novo componente `DriverCityRedemptionHistory.tsx` que:
- Busca resgates do motorista na tabela `redemptions` filtrado por `customer_id`
- Exibe PIN, status (PENDING/USED/EXPIRED), nome da oferta, valor do crédito, data
- Visual similar ao `DriverRedeemOrderHistory` existente
- Permite copiar o PIN de resgates PENDING

### 2. Integrar o histórico no DriverMarketplace
Adicionar uma seção "Meus Resgates na Cidade" no marketplace do motorista, acessível via botão no header ou seção dedicada, mostrando os últimos resgates com seus PINs e status.

### 3. Criar RPC para buscar resgates do motorista
Nova função `rpc_get_driver_city_redemptions` (`SECURITY DEFINER`) que:
- Recebe `p_customer_id` e retorna resgates com dados da oferta e loja
- Não depende de `auth.uid()` (motoristas usam login por CPF)

```sql
CREATE FUNCTION public.rpc_get_driver_city_redemptions(p_customer_id uuid)
RETURNS TABLE(id uuid, token text, status text, created_at timestamptz, 
              expires_at timestamptz, offer_title text, store_name text,
              value_rescue numeric, min_purchase numeric, used_at timestamptz)
```

### 4. Melhorar resiliência da lista "Aguardando Baixa" na loja
- Adicionar botão de refresh manual visível
- Garantir que o realtime channel esteja ativo para atualizações automáticas
- Melhorar mensagem de erro quando a sessão expira

## Arquivos a criar/modificar

| Arquivo | Alteração |
|---|---|
| **Nova migration SQL** | Criar RPC `rpc_get_driver_city_redemptions` |
| `src/components/driver/DriverCityRedemptionHistory.tsx` (novo) | Componente de histórico de resgates na cidade |
| `src/components/driver/DriverMarketplace.tsx` | Adicionar acesso ao histórico de resgates na cidade |
| `src/components/store-owner/StoreRedeemTab.tsx` | Melhorar feedback de refresh/sessão |




# Adicionar Fluxo de Resgate nas Ofertas da Cidade (Driver)

## Problema
A tela de detalhes das ofertas de cidade (`CityOfferDetailOverlay`) é apenas informativa — não há botão de resgate. O motorista precisa poder resgatar créditos em lojas parceiras da mesma forma que o cliente faz no `CustomerOfferDetailPage`.

## Diferença Arquitetural
O motorista usa login via CPF (`useDriverSession`), sem sessão Supabase Auth. Portanto, o fluxo de resgate precisa:
- Usar `driver.id` como `customer_id`
- Já ter o CPF disponível no contexto (sem necessidade de pedir novamente)
- Inserir na tabela `redemptions` + debitar `points_ledger` + atualizar saldo

## Plano

### 1. Criar componente `DriverCityRedeemFlow.tsx`
Novo componente em `src/components/driver/` que encapsula o fluxo de resgate para ofertas de cidade:
- **Verificação de código** (reutiliza `DriverVerifyCodeStep`)
- **Tela de confirmação** mostrando: crédito (R$), compra mínima, pontos necessários, saldo atual
- **Botão "Confirmar Resgate"** que:
  1. Insere registro na tabela `redemptions` (offer_id, customer_id, brand_id, branch_id, status PENDING, customer_cpf)
  2. Debita pontos no `points_ledger` (entry_type DEBIT, reference_type REDEMPTION)
  3. Atualiza `customers.points_balance`
  4. Exibe PIN/token gerado
- **Tela de sucesso** com PIN e instrução para apresentar na loja

### 2. Atualizar `CityOfferDetailOverlay.tsx`
- Adicionar botão fixo no rodapé "Resgatar X pts" (estilo igual ao CTA do cliente)
- Validar saldo insuficiente (bloquear botão + mensagem)
- Ao clicar, abrir o `DriverCityRedeemFlow`
- Passar `driver` do contexto para o fluxo

### 3. Atualizar `DriverMarketplace.tsx`
- Passar callback `onRedeemSuccess` para o overlay para refresh de saldo após resgate

### 4. Expandir tipo `OfertaCidade`
- Incluir `store_id` no tipo (necessário para o registro de redemption)
- Ajustar query em `DriverMarketplace` para trazer `store_id`

## Arquivos Afetados

| Arquivo | Ação |
|---------|------|
| `src/components/driver/DriverCityRedeemFlow.tsx` | **Novo** — fluxo de resgate com verificação, confirmação e PIN |
| `src/components/driver/CityOfferDetailOverlay.tsx` | Adicionar CTA de resgate no rodapé + integração com fluxo |
| `src/components/driver/SecaoResgateCidade.tsx` | Adicionar `store_id` ao tipo `OfertaCidade` |
| `src/components/driver/DriverMarketplace.tsx` | Passar `store_id` na query + callback de sucesso |

## Fluxo do Motorista
```text
Oferta Detalhe → Botão "Resgatar X pts"
  → Verificação (código SMS/WhatsApp)
    → Confirmação (crédito, compra mín, saldo)
      → Confirmar → PIN gerado → Apresentar na loja
```


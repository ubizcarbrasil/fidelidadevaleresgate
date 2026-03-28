

# O que já está implementado vs. o que falta

## Já implementado (100%)
- Admin marca deals como resgatáveis com custo em pontos
- Seção "Resgatar com Pontos" no marketplace do motorista
- Checkout completo com endereço, CEP (ViaCEP), nome, telefone, CPF
- Painel admin de pedidos de resgate com workflow de status
- Notificações push ao mudar status
- Filtros por status na página admin
- Histórico de resgates no dashboard do motorista

## O que falta (baseado na sua descrição)

### 1. Página "Como Funciona" para o Motorista
Uma tela educativa/informativa acessível pelo marketplace ou dashboard explicando:
- Como ganhar pontos comprando no Mercado Livre (1 R$ = 1 pt)
- O processo: enviar link para WhatsApp → receber link de pontuação → comprar → aguardar 30-40 dias
- Regra: só pontua com o link correto da Ubiz
- Preço não muda, vantagem é o acúmulo de pontos
- Pode comprar para amigos/familiares e os pontos vão para sua conta
- Como usar os pontos no e-commerce de resgate

**Arquivo:** `src/components/driver/DriverProgramInfo.tsx`
**Integração:** Botão/ícone de "?" ou "Como Funciona" no header do marketplace e no dashboard

### 2. Seção dedicada de Resgate (página completa)
Atualmente o resgate é apenas um carrossel horizontal. Criar uma página completa de "Loja de Resgate" com:
- Grid de produtos resgatáveis (visual de e-commerce)
- Filtro por categoria
- Exibição do saldo de pontos do motorista no topo
- Acesso via botão "Ver todos" na seção de resgate ou via aba no marketplace

**Arquivo:** `src/components/driver/DriverRedeemStorePage.tsx`

### 3. Botão de WhatsApp para enviar link do ML
No marketplace, adicionar um CTA visível para o motorista enviar links de produtos do ML via WhatsApp, facilitando o fluxo de geração de links de pontuação.

**Integração:** Banner ou card no marketplace com link direto para o WhatsApp da marca com mensagem pré-formatada

---

## Detalhes técnicos

| Ação | Arquivo |
|------|---------|
| Criar | `src/components/driver/DriverProgramInfo.tsx` — página educativa com regras do programa |
| Criar | `src/components/driver/DriverRedeemStorePage.tsx` — loja completa de resgate com grid |
| Editar | `src/components/driver/DriverMarketplace.tsx` — botão "Como Funciona", link "Ver todos" no resgate, CTA WhatsApp para ML |
| Editar | `src/pages/customer/CustomerDriverDashboardPage.tsx` — link para "Como Funciona" |

Nenhuma migração de banco necessária — tudo usa a estrutura existente.


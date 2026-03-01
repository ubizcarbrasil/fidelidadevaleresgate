

## Plano: Página "Meus Resgates" no App do Cliente

### O que será feito

**1. Adicionar tab "Meus Resgates" no menu inferior**
- Novo tab entre "Ofertas" e "Carteira" com ícone de ticket (`Ticket`)
- Tab type expandido: `"home" | "offers" | "redemptions" | "wallet" | "profile"`

**2. Criar página `CustomerRedemptionsPage`** (novo arquivo)

Replica fielmente o layout das referências:

```text
┌──────────────────────────────────┐
│  ← Meus Resgates                │
│                                  │
│  ┌ Saldo disponível   R$XXX,XX ┐│
│  └─────────────────────────────┘│
│                                  │
│  🔍 Buscar por código ou loja... │
│                                  │
│  [Todos 12] [Pendentes 8] [Usados 3] [Expirados 1] │
│                                  │
│  ── RESGATE ──────── EMITIDO ── │
│  #PED260301...                   │
│  [logo] Nome da Loja   PRODUTO  │
│        R$ 200,00                 │
│  ┌ Detalhes do Produto ────────┐│
│  │ Valor: R$ 200,00            ││
│  │ Crédito: 20% = R$ 40,00    ││
│  │ Validade: 30 dias           ││
│  │ Não cumulativa              ││
│  │ Resgate via: endereço...    ││
│  │ WhatsApp: (22)...           ││
│  │ Site: https://...           ││
│  └─────────────────────────────┘│
│                                  │
│  CRÉDITO DO PRODUTO   R$40,00   │
│  Resgate:    01/03/2026, 14:44  │
│  Expira:     31/03/2026, 14:44  │
│                                  │
│  [ 🔲 VER QR CODE E PIN ]       │
│                                  │
│  ── próximo card... ──           │
└──────────────────────────────────┘
```

**3. Criar overlay de detalhes do resgate** (ao clicar "VER QR CODE E PIN")

Página full-screen com:
- Imagem da oferta (ou logo da loja como fallback)
- Título (ex: "15% OFF") + nome da loja
- 3 colunas: Crédito | Validade | Status
- Seção "COPIE SEU PIN" com caixa tracejada + botão Copiar
- Seção "COMO RESGATAR" com botões dinâmicos:
  - Ver Localização (Google Maps via `stores.address`)
  - Resgatar no WhatsApp (`wa.me/{stores.whatsapp}`)
  - Resgatar no Site (`stores.site_url`)
  - Ver Instagram (`instagram.com/{stores.instagram}`)
- Seção "REGRAS DE RESGATE" com ícones (Validade, Cumulativo, Local)
- Seção "DETALHES DO PEDIDO" (código, valor, crédito, pontos, data)
- Botão "VOLTAR PARA HOME"

### Detalhes técnicos

**Arquivos modificados:**
- `src/components/customer/CustomerLayout.tsx` — adicionar tab "Meus Resgates" com ícone `Ticket`, importar nova página, expandir tipo `Tab`

**Arquivos criados:**
- `src/pages/customer/CustomerRedemptionsPage.tsx` — lista de resgates com filtros, busca, cards detalhados
- `src/pages/customer/CustomerRedemptionDetailPage.tsx` — overlay com PIN, QR code, ações da loja, regras

**Query principal (lista):**
```sql
SELECT r.*, offers(title, image_url, value_rescue, discount_percent, 
  coupon_type, redemption_type, terms_text, min_purchase, start_at, end_at,
  stores(name, logo_url, address, whatsapp, site_url, instagram)),
  branches(name)
FROM redemptions r
WHERE r.customer_id = {customer.id}
ORDER BY r.created_at DESC
```

**Filtros por status:** Todos | Pendentes (PENDING) | Usados (USED) | Expirados (EXPIRED) com contadores

**Cores e estilo (fiel às referências):**
- Header com gradiente verde (primary)
- Card de saldo com fundo primary e texto branco/amarelo
- Badges amarelas "EMITIDO" / "PRODUTO"
- Card de detalhes com borda verde, ícones verdes em círculos
- Botão "VER QR CODE E PIN" amarelo, arredondado, bold
- Botões de ação: amarelo (Localização), verde (WhatsApp), preto (Site)
- Textos de valor em verde/primary, datas de expiração em vermelho


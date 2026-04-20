

# Alinhar “Editar Cidade” ao produto comercial contratado

## Diagnóstico (confirmado no banco)

A empresa **Drive Engajamento** contratou o produto **Engajamento Motorista Premium** (`vr_motorista_premium`), que tem:

- **Modelos de negócio inclusos:** todos com `audience = 'motorista'` (Cinturão, Aposta, Duelo, Resgate por Pontos, Ranking, Resgate na Cidade)
- **Zero modelos de cliente/passageiro**
- **19 módulos** habilitados — todos voltados para motorista

Mas a tela `BrandBranchForm.tsx` (Editar Cidade) hoje:

1. Renderiza **Card “Modelo de Pontuação”** com 3 opções fixas (Motorista, Cliente, Ambos) — sem checar o que o produto comprou. A cidade Olímpia foi salva como `BOTH` mesmo com produto exclusivamente de motorista.
2. Renderiza **Card “Módulos de Negócio”** com 5 toggles fixos (Duelo, Achadinho, Mercado Livre, Corra e Ganhe, **Cliente Pontua**) — “Cliente Pontua” e “Achadinho” aparecem mesmo quando não estão no plano.
3. Renderiza **Card “Conversão de Resgate por Público”** com input de **Taxa do Passageiro** mesmo quando o produto é só motorista.
4. Renderiza **Card “Regra de Resgate”** independente da audiência.
5. **Não consulta** `plan_business_models`, `plan_module_templates` nem `business_models.audience` para filtrar a UI.

Resultado: o franqueado/empreendedor enxerga e ativa funcionalidades que **não fazem parte do produto contratado**, criando inconsistência entre comercial × operacional.

## O que vou fazer

### 1. Hook novo: `useProductScope`
Arquivo: `src/features/city_onboarding/hooks/hook_escopo_produto.ts`

Centraliza a leitura do escopo da marca:
- Lê `brands.subscription_plan` da marca atual
- Busca em `plan_business_models` os modelos inclusos
- Deriva `audiences: Set<'motorista' | 'cliente' | 'b2b'>`
- Busca em `plan_module_templates` os module_keys habilitados → `Set<string>`
- Expõe helpers:
  - `hasAudience('motorista' | 'cliente')`
  - `hasModuleKey(key)`
  - `allowedScoringModels: ('DRIVER_ONLY' | 'PASSENGER_ONLY' | 'BOTH')[]` (derivado das audiências)

### 2. Refatorar `BrandBranchForm.tsx`
Arquivo: `src/pages/BrandBranchForm.tsx`

**Card “Modelo de Pontuação”:**
- Esconder opções incompatíveis com o produto:
  - Sem audiência `cliente` → some “Pontuar apenas Cliente” e “Pontuar Ambos”
  - Sem audiência `motorista` → some “Pontuar apenas Motorista” e “Pontuar Ambos”
- Se sobrar só uma opção, ela vem **pré-selecionada e bloqueada** com badge “Definido pelo seu produto”
- Em ambientes legados (cidade já salva como `BOTH` num produto só de motorista), exibir aviso de inconsistência e botão “Ajustar para DRIVER_ONLY”

**Card “Módulos de Negócio”:**
Cada toggle só renderiza se a `module_key` correspondente estiver habilitada no plano:
- `enableDuelsModule` → `duels` ou `achadinhos_motorista` no plano
- `enableAchadinhosModule` → `affiliate_deals` no plano
- `enableMarketplaceModule` → `product_redemptions` no plano
- `enableRaceEarnModule` → `points` ou audiência motorista
- `enableCustomerScoringModule` → `earn_points_store` no plano (audiência cliente)

Quando todos os toggles do card são escondidos, o card inteiro some.

**Card “Gamificação de Motoristas”:**
- Inteiro escondido se a marca não tem nenhum modelo `audience = 'motorista'`

**Card “Conversão de Resgate por Público”:**
- Esconder input “Taxa do Passageiro” se sem audiência cliente
- Esconder input “Taxa do Motorista” se sem audiência motorista
- Se ficar só um, vira card simples “Taxa de Conversão”

**Card “Regra de Resgate”:**
- Mantém visível apenas se houver `redemption_rules` ou `redemption_qr` no plano

**Card `<CardPontuacaoMotorista />` (passageiro/motorista):**
- Só renderiza se houver audiência motorista no plano

### 3. Banner informativo no topo
Adicionar no header de “Editar Cidade” um chip discreto:
> 🎯 Plano: **Engajamento Motorista Premium** — apenas funcionalidades incluídas estão visíveis abaixo

Com link para a página de Assinatura caso o usuário queira mudar de plano.

### 4. Defesa no save
No `handleSave`:
- Se `scoring_model` salvo for incompatível com o plano (ex: `BOTH` sem audiência cliente), forçar normalização para o valor compatível antes de gravar
- Mesma defesa para os flags de módulos: zerar flags de módulos que não estão no plano

### 5. Página `BrandBranchesPage.tsx` (lista)
Pequeno ajuste: o badge de “Cliente/Misto” na lista também não deve aparecer se a marca não tem audiência cliente — usa o mesmo `useProductScope`.

## O que NÃO vou mexer

- ❌ Banco, RLS, edge functions, RPC `resolve_active_modules`
- ❌ Lógica de pontuação na `machine-webhook` (já respeita `scoring_model` da branch)
- ❌ Wizard de Produtos Comerciais (Root)
- ❌ Outras telas de configuração que não sejam “Editar Cidade” / “Cidades”

## Resultado esperado

Para a empresa **Drive Engajamento** (produ
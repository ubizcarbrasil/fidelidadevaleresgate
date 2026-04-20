

# Bug: módulos de motorista aparecendo em cidade de plano "Cliente Resgata"

## Diagnóstico (confirmado no banco)

A brand "Drive Clientes" está corretamente configurada:
- `subscription_plan = 'clienteresgata'` ✅
- 4 business_models todos com `audience = 'cliente'` ✅
- 4 module_keys: `affiliate_deals`, `earn_points_store`, `points`, `product_redemptions` ✅

Mas a UI de cidade (`BrandBranchForm.tsx`) ainda mostra:
- ❌ **Módulo Mercado Livre** — marketplace de produtos para motorista
- ❌ **Módulo Corra e Ganhe Pontos** — pontos por corrida (exclusivo motorista)
- ⚠️ **Módulo Achadinho** — válido, mas com texto enganoso ("clientes e motoristas")

**Causa raiz:** as regras de visibilidade no `BrandBranchForm.tsx` (linhas 63-67) verificam só `module_key`, sem cruzar com `audience`:

```ts
const podeMarketplace = escopo.hasModuleKey("product_redemptions");
const podeRaceEarn = escopo.hasModuleKey("points") || audienciaMotorista;
```

Como o plano `clienteresgata` tem o módulo `points` (que cliente também usa para ganhar pontos), o toggle "Corra e Ganhe" — que é semanticamente só de motorista — fica visível indevidamente.

O mesmo vale para `product_redemptions`: existe pra cliente (resgate de produto na vitrine), mas o toggle "Mercado Livre" descreve resgate de **motorista**.

Os toggles `enable_marketplace_module` e `enable_race_earn_module` foram batizados/escritos pensando em motorista (texto da label confirma: "Marketplace de produtos para resgate de motoristas", "Motoristas acumulam pontos a cada corrida finalizada").

## Correção

### 1. `BrandBranchForm.tsx` — regras de visibilidade combinam módulo + audiência

Atualizar as 5 condições (linhas 63-69) para cruzar `module_key` com `audience`:

```ts
// Toggles que SÓ fazem sentido para motorista
const podeDuelos        = escopo.hasAnyModuleKey("duels", "achadinhos_motorista") && audienciaMotorista;
const podeMarketplace   = escopo.hasModuleKey("product_redemptions") && audienciaMotorista;
const podeRaceEarn      = (escopo.hasModuleKey("points") || escopo.hasModuleKey("driver_scoring")) && audienciaMotorista;

// Achadinho serve ambos
const podeAchadinhos    = escopo.hasModuleKey("affiliate_deals");

// Cliente Pontua: já está correto
const podeClientePontua = escopo.hasModuleKey("earn_points_store") && audienciaCliente;
```

Resultado para "Drive Clientes" (audience só `cliente`):
- ❌ Duelo (oculto — exige motorista)
- ✅ Achadinho (visível — neutro)
- ❌ Mercado Livre (oculto — exige motorista)
- ❌ Corra e Ganhe (oculto — exige motorista)
- ✅ Cliente Pontua (visível — exige cliente, e a brand tem)

### 2. Atualizar o texto da label do "Módulo Achadinho"

Como Achadinho aparece tanto pra cliente quanto motorista, ajustar a descrição contextualmente:
```tsx
<p className="text-xs text-muted-foreground mt-0.5">
  {audienciaMotorista && audienciaCliente
    ? "Vitrine de ofertas afiliadas para clientes e motoristas."
    : audienciaCliente
      ? "Vitrine de ofertas afiliadas para clientes."
      : "Vitrine de ofertas afiliadas para motoristas."}
</p>
```

### 3. Defesa em profundidade — sanity check no save

Em `BrandBranchForm.tsx`, no momento do `onSubmit`, forçar `false` em flags que não deveriam estar ativas:

```ts
const finalSettings = {
  ...,
  enable_duels_module: podeDuelos ? flagDuels : false,
  enable_marketplace_module: podeMarketplace ? flagMarketplace : false,
  enable_race_earn_module: podeRaceEarn ? flagRace : false,
  enable_achadinhos_module: podeAchadinhos ? flagAchadinhos : false,
  enable_customer_scoring_module: podeClientePontua ? flagCustomer : false,
};
```

Garante que mesmo se o toggle vazar visualmente (cache, bug futuro), o backend nunca grave true em flag inválida pro plano.

### 4. Atualizar memory `business-model-dynamic-visibility`

Adicionar regra: visibilidade de toggle deve combinar `module_key` E `audience`, nunca apenas um dos dois.

## Arquivos modificados

1. `src/pages/BrandBranchForm.tsx` — 5 regras de visibilidade + label Achadinho + sanity check no save
2. `mem://features/admin/business-model-dynamic-visibility` — atualização da regra

## O que NÃO vou mexer

- ❌ `hook_escopo_produto.ts` — está correto, expõe os helpers certos
- ❌ Tabelas / migrations — dados já estão corretos
- ❌ Outros toggles de App do Motorista (Carteira, WhatsApp etc) — já estão dentro de `audienciaMotorista`
- ❌ Ofertas, pontos, business models — não tem relação

## Resultado esperado

Cidade da brand "Drive Clientes" mostra apenas 2 toggles em "Módulos de Negócio":
- Módulo Achadinho (com texto adaptado pra cliente)
- Módulo Cliente Pontua

Os toggles "Mercado Livre", "Corra e Ganhe Pontos" e "Duelo" desaparecem, e o bloco inteiro "App do Motorista" também (já era escondido por `audienciaMotorista`).

Brands que vendem produtos com audience mista (motorista + cliente) continuam vendo todos os toggles relevantes.

## Risco

Baixo. Mudanças concentradas em 1 arquivo e adicionam restrições (não relaxam). Outras brands com audience `motorista` continuam vendo todos os toggles. Sanity check no save é defesa adicional sem efeito visível para o usuário.

## Estimativa

~4 min.


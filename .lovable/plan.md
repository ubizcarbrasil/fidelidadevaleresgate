

# Bug crítico: vazamento de dados entre empresas + audiência errada no produto

## Diagnóstico (com evidências do banco)

### 🔴 Problema 1 — VAZAMENTO DE DADOS ENTRE TENANTS (gravíssimo)

A marca **"Ubiz Resgata"** (sua marca matriz) está vinculada ao domínio `app.valeresgate.com.br` na tabela `brand_domains`:

```
domain                  | brand
app.valeresgate.com.br  | Ubiz Resgata    ← portal universal apontando para 1 brand específica
```

**Fluxo do bug:**
1. Empresa "Drive Clientes" foi criada via trial (brand_id = `e1abe772-...`)
2. Owner dessa empresa faz login em `app.valeresgate.com.br`
3. `BrandContext.resolveBrandByDomain("app.valeresgate.com.br")` → encontra match em `brand_domains` → retorna **"Ubiz Resgata"** (brand_id = `1dcbe0c0-...`)
4. `useBrandGuard.currentBrandId` prioriza `brand.id` do contexto sobre os roles do usuário
5. **Todas as queries** (Cidades, Dashboard, Configurações) filtram por `brand_id = Ubiz Resgata`
6. Owner da Drive Clientes vê: cidades Araxa/Leme/Olimpia/Ourinhos (que são da Ubiz Resgata), 2.458 motoristas, 22.945 pontos — **todos dados de outra empresa**

Confirmado no banco: as 4 cidades visíveis na imagem pertencem à Ubiz Resgata, não à Drive Clientes (que tem só 1 cidade própria: Ourinhos-SP).

### 🔴 Problema 2 — Provisionamento incompleto

A brand "Drive Clientes" foi criada, mas no banco está com:
- `brand_modules` = **0 registros** (deveria ter 24 do produto Cliente Resgata)
- `brand_business_models` = **0 registros** (deveria ter 4: Achadinho/Pontua/Resgate Pontos/Resgate Cidade — todos audience=`cliente`)

Provavelmente a `provision-trial` falhou parcialmente ou foi criada sem `plan_slug`. Mesmo com isso resolvido pela governança, o módulo de Cliente Resgata **deveria** trazer só funcionalidades de cliente — mas como o BrandContext está apontando para outra brand, o usuário vê o que a Ubiz Resgata tem ativado (motorista).

### 🟡 Problema 3 — `useBrandGuard` ignora os roles do usuário

```ts
const currentBrandId = useMemo(() => {
  if (brand) return brand.id;  // ← prioriza domain resolution
  const brandRole = roles.find(r => r.brand_id);
  return brandRole?.brand_id || null;
}, [brand, roles]);
```

Mesmo se `BrandContext` for corrigido, a lógica está frágil: se o admin de uma marca cair em domínio errado, `brand.id` ganha sempre. Precisa **validar** que o `brand.id` resolvido bate com algum role do usuário.

## Correção

### 1. `BrandContext.tsx` — portal universal NÃO resolve brand pelo hostname

Adicionar `app.valeresgate.com.br` à lista de hostnames que pulam resolução por domínio (igual `localhost`/`lovable.app`):

```ts
const PORTAL_HOSTNAMES = ["app.valeresgate.com.br"];

const isLocal = hostname === "localhost"
  || hostname.includes("lovable.app")
  || hostname.includes("lovableproject.com")
  || hostname.startsWith("root.")
  || PORTAL_HOSTNAMES.includes(hostname);  // ← portal universal

if (isLocal) {
  return; // brand fica null, useBrandGuard cai pro role do usuário
}
```

Resultado: no portal `app.valeresgate.com.br`, o `BrandContext.brand` fica `null` para usuários autenticados (exceto via `?brandId=`), e o `useBrandGuard` resolve pelo role do usuário logado — cada admin vê só a SUA marca.

### 2. `useBrandGuard.ts` — validar consistência brand vs roles (defesa em profundidade)

Quando há `brand` no contexto e o usuário NÃO é root admin, validar se ele tem role naquela brand. Se não tiver, ignorar o brand do contexto e usar o role:

```ts
const currentBrandId = useMemo(() => {
  if (brand) {
    if (isRootAdmin) return brand.id;
    // Não-root: brand do contexto SÓ vale se o usuário tem role naquela brand
    const hasRoleInBrand = roles.some(r => r.brand_id === brand.id);
    if (hasRoleInBrand) return brand.id;
  }
  // Fallback: usar brand_id do role do usuário
  const brandRole = roles.find(r => r.brand_id);
  return brandRole?.brand_id || null;
}, [brand, roles, isRootAdmin]);
```

Aplicar a mesma lógica para `currentBranchId`.

### 3. Carregar `branches` no `BrandContext` quando brand vier de role (não só de domain)

Hoje o `useEffect` que carrega branches depende de `brand` estar setado pelo `BrandContext`. Quando o brand sai do role (portal universal), precisamos buscar as branches da brand correta. Adicionar fallback:

```ts
useEffect(() => {
  if (brand) { /* já carrega */ return; }
  // Sem brand resolvido → tenta carregar via role do usuário (portal universal)
  if (!user) return;
  // buscar role do usuário e carregar a brand + branches correspondentes
}, [user, brand]);
```

Estender `BrandProvider` para resolver brand a partir do role do usuário quando estiver em portal universal e autenticado.

### 4. Corrigir provisionamento da brand "Drive Clientes" (data fix)

Migration que:
- Insere os 24 `brand_modules` baseados em `plan_module_templates` para `plan_key='clienteresgata'`
- Insere os 4 `brand_business_models` baseados em `plan_business_models` para `plan_key='clienteresgata'`
- Define `branches.scoring_model = 'PASSENGER_ONLY'` para a branch Ourinhos-SP da Drive Clientes (porque o produto é só de cliente)

### 5. `provision-trial` — definir `scoring_model` da branch baseado nos business_models do produto

Quando criar a branch (passo 4 da função), inferir o `scoring_model` a partir das `audience` dos business_models do produto:
- Só `motorista` → `DRIVER_ONLY`
- Só `cliente` → `PASSENGER_ONLY`
- Mistos ou nenhum → `BOTH`

Garante que produtos novos vendidos já criem a cidade com a configuração correta.

## Arquivos modificados

1. `src/contexts/BrandContext.tsx` — pular resolução de domínio para portal universal + carregar brand via role quando aplicável
2. `src/hooks/useBrandGuard.ts` — validar brand contra roles do usuário
3. `supabase/functions/provision-trial/index.ts` — setar `scoring_model` da branch baseado nas audiences dos business_models
4. **Nova migration** — corrigir dados da brand "Drive Clientes" (ativar módulos + business_models + scoring_model da branch Ourinhos)
5. **Migration de cleanup** — desvincular `app.valeresgate.com.br` da brand "Ubiz Resgata" em `brand_domains` (ou marcar como `is_primary=false`), porque o portal universal não deve apontar para nenhuma brand

## O que NÃO vou mexer

- ❌ Outras brands existentes (Drivetu, Meu Mototaxi, Ubiz Car, Drive engajamento) — funcionam com seus subdomínios próprios
- ❌ Lógica de white-label em domínios próprios (ex: `drive-clientes.valeresgate.com`) — continua resolvendo brand pelo domínio
- ❌ RLS policies — o problema não é falta de RLS, é o cliente passando `brand_id` errado nas queries (RLS confiou no `auth.uid()` mas o admin tem permissão em ambas se for cross-tenant — não é o caso aqui, mas vale revisar depois)
- ❌ Tela de listagem de produtos / wizard de criação

## Resultado esperado

- Owner da Drive Clientes loga em `app.valeresgate.com.br` → vê SÓ as suas próprias cidades, dashboard e dados (não da Ubiz Resgata)
- Brand "Drive Clientes" passa a ter os 24 módulos e 4 business_models de cliente ativos
- Branch de Ourinhos-SP fica como `PASSENGER_ONLY` → UI esconde elementos de motorista (regras já existentes em `business-model-dynamic-visibility`)
- Próximas brands criadas via produtos comerciais já nascem com `scoring_model` correto baseado na audiência do produto
- Defesa em profundidade no `useBrandGuard`: mesmo se algum bug futuro tentar inserir brand errada no contexto, queries só usam brand onde o usuário tem role

## Risco

**Médio.** Mudança no `BrandContext` afeta a resolução de brand em produção:
- ✅ Domínios próprios (drive-clientes.valeresgate.com etc) continuam resolvendo igual
- ⚠️ Portal `app.valeresgate.com.br` muda comportamento: brand sai do domain, vira role-based
- ⚠️ A migration de data fix toca a brand do usuário (Drive Clientes) — vou revisar antes de aplicar

Mitigação: testar fluxo após deploy logando como admin da Drive Clientes e admin da Ubiz Resgata para confirmar que cada um vê só os seus dados.

## Estimativa

~12 min (3 arquivos de código + 2 migrations + verificação).


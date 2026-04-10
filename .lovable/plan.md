

# Entendimento: Arquitetura SaaS White-Label Multi-Nível

## O Modelo Atual

```text
┌─────────────────────────────────────────────────────┐
│                  PAINEL RAIZ (ROOT)                  │
│        fidelidadevaleresgate.lovable.app             │
│  Vê tudo: marcas, cidades, parceiros, motoristas    │
│  Gerencia: módulos, planos, domínios globais        │
├─────────────────────────────────────────────────────┤
│            PAINEL MARCA (EMPREENDEDOR)               │
│  Mesmo domínio, diferenciado por papel (brand_admin) │
│  Gerencia: suas cidades, parceiros, módulos          │
│  Configura: domínio próprio (brand_domains)          │
├─────────────────────────────────────────────────────┤
│         WHITE-LABEL (domínio da marca)               │
│  ubiz-car.valeresgate.com → App Cliente              │
│  ubiz-car.valeresgate.com/driver → Motorista         │
│  Cada marca tem identidade visual própria            │
└─────────────────────────────────────────────────────┘
```

## O Problema

Hoje, o **Painel Root** e o **Painel do Empreendedor** vivem no mesmo domínio e na mesma aplicação. A diferenciação é apenas por role do usuário logado. Isso causa:

1. **Mistura de contextos** — Root e Empreendedor compartilham o mesmo domínio e sidebar
2. **Central de Acessos incompleta** — a página `/access-hub` não reflete a hierarquia real do SaaS
3. **Domínio white-label serve apenas o app do cliente** — o painel administrativo do empreendedor NÃO roda no domínio próprio dele

## A Hierarquia Correta do SaaS

```text
NÍVEL 1 — PLATAFORMA (Root Admin)
  │  Domínio: admin.valeresgate.com (ou lovable.app)
  │  Visão: todas as marcas, todos os dados
  │
  ├── NÍVEL 2 — MARCA / EMPREENDEDOR (Brand Admin)
  │     │  Domínio próprio: admin.ubizcar.com.br
  │     │  Visão: apenas sua marca
  │     │
  │     ├── NÍVEL 3 — CIDADE (Branch Admin)
  │     │     │  Acesso via painel da marca (filtro por cidade)
  │     │     │  Visão: motoristas, parceiros, carteira daquela cidade
  │     │     │
  │     │     ├── Motoristas da cidade
  │     │     ├── Clientes da cidade
  │     │     └── Parceiros da cidade
  │     │
  │     └── NÍVEL 4 — PARCEIRO (Store Admin)
  │           Acesso: /store-panel
  │           Visão: apenas sua loja
  │
  └── WHITE-LABEL PÚBLICO (domínio da marca)
        ubizcar.com.br → App do Cliente
        ubizcar.com.br/driver → Painel do Motorista
```

## O Que Precisa Mudar

### 1. Separação do Painel Admin do Empreendedor

Hoje, quando um domínio é detectado em `BrandContext`, o sistema ativa `isWhiteLabel = true` e carrega o `WhiteLabelLayout` (app do cliente). O empreendedor **não consegue** acessar seu painel admin pelo domínio próprio.

**Solução**: Quando um domínio white-label é acessado, verificar se o usuário logado é `brand_admin` daquela marca. Se for, mostrar o `AppLayout` (painel admin) em vez do `WhiteLabelLayout`. Assim:
- `ubizcar.com.br` sem login → App do Cliente
- `ubizcar.com.br` com login de brand_admin → Painel do Empreendedor
- `ubizcar.com.br/driver` → Painel do Motorista

### 2. Resignificação da Central de Acessos

A Central de Acessos precisa refletir a hierarquia completa:

**Para o Root**: Árvore de navegação por Marca → Cidades → Motoristas/Clientes/Parceiros, com links diretos para cada painel e visão consolidada de domínios conectados.

**Para o Empreendedor**: Suas cidades → dentro de cada cidade, os motoristas, clientes e parceiros daquela cidade.

### 3. Domínio do Painel Admin vs Domínio Público

Cada marca pode ter **dois usos** para seu domínio:
- **Público** (cliente/motorista): `ubizcar.com.br`
- **Admin** (empreendedor): `ubizcar.com.br` (mesmo domínio, roteamento inteligente por sessão)

O Root sempre acessa pelo domínio da plataforma e pode "entrar" em qualquer marca via `?brandId=`.

## Plano de Implementação

### Etapa 1 — Roteamento Inteligente por Sessão
- Modificar `AppContent` em `App.tsx` para que, em domínio white-label, se o usuário logado for `brand_admin` da marca resolvida, renderize `AnimatedRoutes` (painel admin) em vez de `WhiteLabelLayout`
- Manter o comportamento atual para visitantes anônimos (app do cliente)

### Etapa 2 — Reformular a Central de Acessos
- Root vê: tabela de marcas com expansão para cidades, e dentro de cada cidade: contadores de motoristas/clientes/parceiros + links diretos
- Brand Admin vê: suas cidades com os mesmos detalhes expandidos
- Adicionar coluna de "Domínio" mostrando se a marca tem domínio conectado ou não

### Etapa 3 — Garantir Resolução Pública da Marca
- Corrigir o problema de RLS que impede visitantes anônimos de ver a marca (usar `public_brands_safe` view no `BrandContext`)

### Arquivos Envolvidos

| Arquivo | Mudança |
|---------|---------|
| `src/App.tsx` | Lógica de roteamento inteligente (admin vs cliente em domínio white-label) |
| `src/contexts/BrandContext.tsx` | Usar view pública para resolver marca sem autenticação |
| `src/pages/AccessHubPage.tsx` | Reformular com hierarquia Marca → Cidade → Entidades |

Nenhuma mudança de banco de dados necessária — a infraestrutura já existe.




# Esconder UI de Cliente quando o plano não inclui essa audiência

## Diagnóstico

No plano **Engajamento Motorista Premium** (Drive Engajamento) a audiência `cliente` **não está contratada**, mas a UI ainda mostra elementos de cliente:

1. **Sidebar → Gestão Comercial → "Clientes"** (e Ofertas, Resgates, Cupons, Parceiros, Pontuar, Regras de Pontos, Extrato, etc.) aparecem porque o filtro do sidebar (`scoringFilter: "PASSENGER"`) usa `useBrandScoringModels`, que olha o **`scoring_model` das branches**. Se uma cidade legada está como `BOTH`, todos esses itens reaparecem — mesmo que o plano não cubra clientes.

2. **Página de Ofertas → filtro "Apenas Clientes"** está sempre visível no select de público, sem checar o plano.

A regra correta é: **o plano (produto contratado) define quais audiências existem**. As flags da branch só refinam dentro do que o plano permite.

## Ajuste

### 1. Sidebar do empreendedor (`src/components/consoles/BrandSidebar.tsx`)

Trocar `useBrandScoringModels` por `useProductScope` no filtro do sidebar:

```ts
const escopo = useProductScope();
const audienciaMotorista = escopo.hasAudience("motorista");
const audienciaCliente = escopo.hasAudience("cliente");

// no .filter():
if (item.scoringFilter === "DRIVER") return audienciaMotorista;
if (item.scoringFilter === "PASSENGER") return audienciaCliente;
```

Resultado para Drive Engajamento: somem do menu **Clientes, Ofertas, Resgates, Cupons, Parceiros, Operador PDV, Pontuar, Regras de Pontos, Extrato de Pontos** (todos marcados com `scoringFilter: "PASSENGER"`).

### 2. Página de Ofertas (`src/pages/OffersPage.tsx`)

Esconder o item **"👤 Apenas Clientes"** do select de filtro quando `escopo.hasAudience("cliente") === false`. Quando cliente OFF, o select pode até virar redundante (só sobra "Todas" e "Exclusivo Motorista"), então:

- Se **só motorista**: esconde o select inteiro (todas as ofertas serão de motorista de qualquer forma)
- Se **só cliente**: esconde o select inteiro
- Se **ambos**: mantém os 3 itens

### 3. Página de Cidades (`src/pages/BrandBranchesPage.tsx`)

Já usa `useProductScope` corretamente — não precisa mexer. Apenas um ajuste defensivo: no badge de cidade legada `scoring_model === "BOTH"` quando o plano só tem motorista, já mostra só o badge "Motorista" (linhas 138-145). OK.

### 4. Reset de pontos (`src/components/branch/DialogResetPontos.tsx`)

O radio "Apenas clientes" só faz sentido se a marca tem audiência cliente. Esconder quando `!audienciaCliente`. Quando a marca é só motorista, restam: "Todos os usuários", "Apenas motoristas", "Usuário específico".

## O que NÃO vou mexer

- ❌ Banco / RLS / edge functions
- ❌ Hook `useBrandScoringModels` (continua útil pra outros lugares que precisam saber o que a cidade faz, dentro do que o plano permite)
- ❌ Page Builder, dados_manuais, helpContent (são conteúdos genéricos da plataforma)
- ❌ Sidebar do Branch Admin (`BranchSidebar.tsx`) e Root (`RootSidebar.tsx`) — esses não filtram por plano por design (root vê tudo, branch admin já é restrito por outras regras)

## Resultado esperado

Para a marca **Drive Engajamento** (plano só motorista):

| Antes | Depois |
|---|---|
| Sidebar mostra: Ofertas, Clientes, Resgates, Cupons, Parceiros, Pontuar, Regras de Pontos, Extrato | Esses itens **somem** — só aparece o que é de motorista |
| Filtro de público em Ofertas mostra "Apenas Clientes" | Select inteiro fica oculto (só motorista) |
| Reset de pontos oferece "Apenas clientes" | Opção fica oculta |

Para marcas com **plano completo**: nada muda — tudo aparece como hoje.

## Risco

Baixo. É troca de hook de filtro + 2 condicionais de UI. Build esperado limpo.

## Estimativa

~3 min.


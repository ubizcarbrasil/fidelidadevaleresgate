

# Não é duplicação — são funções diferentes com nomes confusos

## Diagnóstico

Os dois toggles que você circulou **fazem coisas opostas**, mas os nomes são quase idênticos:

| Toggle | Flag no banco | O que faz | Onde aparece |
|---|---|---|---|
| 💳 **Motorista compra pontos** | `enable_driver_points_purchase` | O motorista **compra pontos com dinheiro** (R$) — abre o overlay de compra de saldo | Botão "Comprar Pontos" no painel do motorista |
| 🛒 **Motorista compra com pontos** | `enable_points_purchase` | O motorista **gasta pontos** comprando produtos/ofertas — exibe a seção "Compre com Pontos" | Vitrine "Compre com Pontos" no marketplace |

Ou seja:
- **"compra pontos"** → entrada de saldo (input de R$)
- **"compra com pontos"** → saída de saldo (gasta pontos)

A diferença está em uma única letrinha (`com`), o que é horrível de ler num app mobile e gera exatamente a sensação de duplicação que você teve.

## O que vou ajustar

Arquivo: `src/pages/BrandBranchForm.tsx` (seção "App do Motorista", linhas ~759-797)

### 1. Renomear para deixar inequívoco

| Antes | Depois |
|---|---|
| 💳 Motorista compra pontos | 💳 **Comprar pontos com dinheiro** |
| Permite que motoristas comprem pontos diretamente pelo app. | Motorista compra saldo de pontos pagando em R$ (entrada de pontos). |
| 🛒 Motorista compra com pontos | 🛒 **Resgatar produtos com pontos** |
| Exibe a seção "Compre com Pontos" no painel do motorista. | Motorista usa pontos acumulados para resgatar produtos da vitrine. |

### 2. Agrupar visualmente
Colocar os dois toggles dentro de um mini-bloco com título sutil **"Carteira de Pontos"** para deixar claro que são as duas pontas (entrada e saída) da mesma carteira:

```
┌─ Carteira de Pontos ────────────────────────┐
│  💳 Comprar pontos com dinheiro      [⚪]  │
│     Entrada: paga R$ e recebe pontos        │
│                                              │
│  🛒 Resgatar produtos com pontos     [⚪]  │
│     Saída: gasta pontos em produtos         │
└─────────────────────────────────────────────┘
```

### 3. Atualizar também o catálogo de toggles
Arquivo: `src/features/configuracao_cidade/constants/constantes_toggles.ts` (linhas 50-67)

Mesma renomeação aplicada nos labels e descrições para manter consistência onde quer que esses toggles apareçam.

## O que NÃO vou mexer

- ❌ Nomes das flags no banco (`enable_driver_points_purchase`, `enable_points_purchase`) — quebraria o consumo em `DriverPanelPage`, `DriverMarketplace`, `CustomerHomePage`
- ❌ Comportamento funcional — só rótulos e agrupamento visual
- ❌ Banco, RLS, edge functions
- ❌ Outros cards da tela

## Resultado esperado

- Fica visualmente óbvio que **não é duplicação**: um é entrada de pontos (compra com R$), o outro é saída (gasta pontos em produtos)
- Agrupamento "Carteira de Pontos" ancora os dois conceitos como faces opostas da mesma moeda
- Mantém compatibilidade total com o resto do sistema

## Risco

Zero. É só renomear textos e envolver em um bloco visual. `npx tsc --noEmit` esperado limpo.

## Estimativa

~3 min.


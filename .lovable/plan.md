

# Filtrar Manuais do Franqueado por Modelo de Negócio

## Problema
A página de Manuais no painel do franqueado (BRANCH) exibe **todos** os manuais da plataforma, incluindo os do empreendedor (Personalização, Gestão Comercial, Programa de Fidelidade, Cashback, etc.) que **não estão disponíveis** para o franqueado. O franqueado deve ver apenas os manuais das funcionalidades que ele realmente tem acesso, filtrados pelo modelo de negócio vigente (Motorista, Passageiro ou Ambos).

## Solução

### 1. Adicionar filtro de scoring aos grupos de manuais do franqueado
Adicionar campo opcional `scoringFilter` ao tipo `GrupoManual` (igual ao sidebar), e marcar os grupos de `gruposManuaisFranqueado` com `scoringFilter: "DRIVER"`.

### 2. Filtrar manuais no `ManuaisPage.tsx`
- Para `BRANCH`: mostrar **somente** `gruposManuaisFranqueado` (remover `gruposManuais` que são do empreendedor)
- Aplicar filtro por `scoringModel` usando `useBranchScoringModel` para ocultar grupos irrelevantes ao modelo de negócio
- Para `BRAND`: manter comportamento atual (todos os manuais)

### Arquivos a modificar
- `src/components/manuais/tipos_manuais.ts` — adicionar `scoringFilter?: "DRIVER" | "PASSENGER"` ao `GrupoManual`
- `src/components/manuais/dados_manuais.ts` — adicionar `scoringFilter: "DRIVER"` aos grupos do franqueado
- `src/pages/ManuaisPage.tsx` — para BRANCH, mostrar só manuais do franqueado + filtrar por scoring model

### Resultado esperado
- Franqueado com modelo DRIVER_ONLY: vê apenas "Achadinhos Motorista — Franqueado" e "Gestão da Cidade (Franqueado)"
- Franqueado com modelo PASSENGER_ONLY: não vê os grupos de motorista (futuramente verá grupos de passageiro quando criados)
- Franqueado com modelo BOTH: vê todos os grupos do franqueado
- Empreendedor: continua vendo tudo como antes


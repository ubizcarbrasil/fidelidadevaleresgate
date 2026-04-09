

# Plano: Histórico de Resets de Pontos no Painel de Cidades

## Problema Identificado

O enum `ledger_reference_type` **não contém** o valor `BRANCH_RESET`. A edge function tenta inserir registros com esse tipo, mas falha silenciosamente. Precisamos corrigir isso e criar a visualização do histórico.

## Mudanças

### 1. Migration: adicionar `BRANCH_RESET` ao enum

Adicionar o valor faltante ao enum `ledger_reference_type` para que os registros de reset sejam efetivamente gravados no `points_ledger`.

### 2. Componente: `HistoricoResetPontos`

**Arquivo**: `src/components/branch/HistoricoResetPontos.tsx`

- Consulta `points_ledger` filtrando por `reference_type = 'BRANCH_RESET'` e `branch_id` da cidade selecionada
- Agrupa os registros por timestamp (resets do mesmo lote têm timestamps muito próximos) para exibir como um único evento
- Exibe: data/hora, escopo (extraído do campo `reason`), quantidade de registros afetados e total de pontos zerados
- Formato de lista/timeline com cards compactos
- Paginação simples (últimos 20 eventos)

### 3. Integração no `BrandBranchesPage`

- Adicionar botão "Histórico de Resets" ou sheet/dialog acessível a partir da página de cidades
- Ao clicar, abre um Sheet lateral com o `HistoricoResetPontos` filtrado pela cidade selecionada

### 4. Alternativa: aba no `DialogResetPontos`

- Adicionar uma seção "Últimos resets" abaixo do formulário de reset, mostrando os 5 últimos resets da cidade de forma compacta (data, escopo, pontos zerados)

## Abordagem escolhida

Adicionar no próprio `DialogResetPontos` uma seção inferior com o histórico recente, mantendo tudo contextualizado em um único lugar. Isso evita navegação extra e o empreendedor vê o histórico antes de decidir fazer um novo reset.

## Resultado

- Resets passarão a ser registrados corretamente no banco (fix do enum)
- O empreendedor verá os últimos resets ao abrir o dialog de reset de qualquer cidade


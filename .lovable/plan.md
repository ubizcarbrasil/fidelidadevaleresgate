

# Plano: Otimização de Performance (INP, Dashboard, Charts)

## Diagnóstico

Após análise do código, identifiquei as causas raiz:

### INP 544-824ms
- Dashboard monta **~20 `useMetric` queries** simultâneas, cada uma disparando re-render individual ao resolver
- `colorMap` é recriado **dentro** do `memo` do KpiCard inline (Dashboard.tsx linha 92-98), anulando a memoização
- Existe um **KpiCard duplicado**: um inline no Dashboard.tsx (linhas 89-145) e outro em `components/dashboard/KpiCard.tsx` — o Dashboard usa o inline
- Mudança de período (`setPeriod`) causa re-render síncrono pesado (invalida ~20 queries + 2 charts)
- Realtime channel invalida múltiplas query keys de uma vez, gerando cascata de re-renders

### Charts -1px
- SparkData usa `ResponsiveContainer width="100%" height="100%"` dentro de `div` com `position: absolute` e `h-12` — quando o card ainda não tem layout, o container calcula -1px
- Afeta Dashboard KpiCard e `components/dashboard/KpiCard.tsx`

## Alterações

### 1. Dashboard.tsx — Eliminar KpiCard duplicado e reduzir re-renders
- Remover o KpiCard inline (linhas 88-145) e importar o de `components/dashboard/KpiCard.tsx`
- Envolver `setPeriod` com `startTransition` para não bloquear interações
- Agrupar invalidações do realtime com `setTimeout` de 100ms (debounce natural)

### 2. KpiCard.tsx (components/) — Corrigir chart -1px
- Trocar `ResponsiveContainer width="100%" height="100%"` por `width="100%" height={48}` (valor fixo, pois o container é `h-12` = 48px)
- Isso elimina o cálculo de layout que gera -1px

### 3. Dashboard.tsx — Otimizar realtime
- No `useRealtimeRefresh`, agrupar as invalidações com um debounce simples para evitar cascata

### 4. chart.tsx (ui) — Proteção global contra -1px
- Adicionar `minWidth={0} minHeight={0}` ao `ResponsiveContainer` do `ChartContainer` para prevenir o warning em qualquer uso do componente shadcn

## Arquivos alterados
1. `src/pages/Dashboard.tsx`
2. `src/components/dashboard/KpiCard.tsx`
3. `src/components/ui/chart.tsx`

## Impacto esperado
- INP reduzido de ~600-800ms para ~200-300ms (eliminação de re-renders síncronos desnecessários)
- Eliminação completa dos warnings de chart -1px
- Sem mudança funcional — mesma aparência e comportamento


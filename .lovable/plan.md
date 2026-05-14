## Objetivo

Reformular o fluxo de criação de temporada para ficar **assertivo, visual e à prova de erros**, conectando: motoristas ativos → séries → duelos → configurações → **data final calculada automaticamente**.

## 1. Nova etapa visual: "Motoristas e Séries"

Adicionar um passo dedicado (tanto no modo automático quanto no avançado) com:

### a) Tabela ranqueada de motoristas ativos da cidade
Colunas: posição (#), nome, telefone, corridas (período de referência), pontos atuais, série sugerida, checkbox de pré-seleção.

- Ranking ordenado por **nº de corridas** (desc) no período configurável (últimos 30 dias por padrão).
- Busca por nome/telefone, filtros (todos / só ativos / só pré-selecionados).
- Ações em lote: selecionar todos, desmarcar, inverter seleção.
- Badge visual indicando se o motorista vem do `[MOTORISTA]` tag e está elegível.

### b) Distribuição em séries
Dois modos dentro da mesma tela:

- **Automático** — botão "Distribuir automaticamente" preenche A→B→C... pegando os top-N por corridas para cada série conforme o `target_size`. Resto vai para a última série ou para "fora".
- **Manual** — drag-and-drop (reaproveitar `ColunaSerie` + `CardMotoristaArrastavel` já existentes) entre colunas A, B, C... e coluna "Disponíveis".

### c) Painel lateral "Resumo da Temporada"
Sempre visível, recalcula em tempo real:
- Motoristas selecionados: X
- Séries: A(16/16) · B(12/16) · C(8/16) — cores: verde dentro do alvo, âmbar cheio, vermelho acima.
- Duelos previstos por série (round-robin: n*(n-1)/2 ou bracket).
- Duração mínima da Classificação calculada (dias).
- **Data final do campeonato** calculada e destacada.
- Avisos: "Série B abaixo do mínimo", "Aumente para 14 dias", etc.

## 2. Cálculo automático da DATA FINAL

Fórmula encadeada e exposta no resumo:

```text
classificacao_dias  = max(maior_serie - 1, 7)        // round-robin
classificacao_fim   = inicio + classificacao_dias

mata_mata_horas     = oitavas + quartas + semi + final  (só fases necessárias
                                                         conforme tamanho da série)
mata_mata_fim       = classificacao_fim + mata_mata_horas

DATA FINAL          = mata_mata_fim
```

Regras:
- Se nenhuma série ≥ 16 → não usa oitavas; ≥ 8 → não usa quartas; etc.
- Mudou tamanho da série, modo de pontuação ou duração de fase → tudo recalcula.
- Botão "Criar temporada" só habilita quando: ≥1 motorista por série, séries dentro do mínimo (2), datas sem conflito/sobreposição.

## 3. Validações que impedem erros

Bloqueios visuais e claros (não só toast):
- Série vazia ou abaixo de 2 motoristas.
- Total de selecionados < soma dos `target_size` (aviso, não bloqueio).
- Conflito mês/ano com outra temporada não cancelada.
- Sobreposição de período.
- Classificação < mínimo recomendado para o tamanho da maior série.

Cada erro aparece **inline** ao lado do campo/série responsável, com sugestão de correção ("Aumentar para 14 dias", "Mover 4 motoristas para B").

## 4. Estrutura de arquivos (feature `campeonato`)

```text
components/empreendedor/criar_temporada/
  PassoMotoristasESeries.tsx          (novo — tela principal do passo)
  TabelaMotoristasRanqueados.tsx      (novo — tabela com ranking + checkbox)
  PainelResumoTemporada.tsx           (novo — sidebar de resumo + data final)
  DistribuidorVisualSeries.tsx        (novo — wrapper drag-and-drop reutilizando ColunaSerie)
  BotaoDistribuirAutomatico.tsx       (novo — ação automática)

hooks/
  hook_motoristas_ranqueados.ts       (novo — busca corridas por motorista no período)
  hook_calculo_data_final.ts          (novo — derivação reativa da data final)
  hook_distribuicao_series.ts         (novo — estado das séries + ações)

utils/
  utilitarios_data_final_temporada.ts (novo — fórmulas puras, testáveis)
  utilitarios_distribuicao_automatica.ts (novo — algoritmo top-N por série)
```

`FormCriarTemporadaAutomatico.tsx` e `FormCriarTemporada.tsx` passam a compor esse novo passo em vez de pedir só duração crua.

## 5. Backend / dados

- Reutilizar RPC existente de seeding (`executar_seeding_temporada`) — já está pronta.
- Nova RPC leve (ou view) **`get_drivers_ranking_for_season(branch_id, since_days)`** retornando: `driver_id, name, phone, rides_count, points_balance` ordenado por `rides_count desc`.
- Persistir pré-seleção e distribuição manual no momento do "Criar temporada" (passa array `manual_assignments` para a mutation existente).

## 6. Entregáveis e ordem de implementação

1. Migração: criar RPC `get_drivers_ranking_for_season`.
2. Utilitários puros + hooks (`hook_motoristas_ranqueados`, `hook_calculo_data_final`, `hook_distribuicao_series`).
3. `TabelaMotoristasRanqueados` + `PainelResumoTemporada` + `DistribuidorVisualSeries`.
4. `PassoMotoristasESeries` integrando tudo.
5. Plugar nos dois formulários (automático e avançado), removendo inputs hoje redundantes.
6. Validar fluxo end-to-end na cidade Leme: criar temporada, distribuir, conferir data final.

## Observações técnicas

- Drag-and-drop: reaproveitar `@dnd-kit` já em uso (`CardMotoristaArrastavel`, `ColunaSerie`).
- Tabela ranqueada: `Table` do shadcn já no projeto; paginação client-side (até ~500 motoristas/cidade).
- Estado: React Hook Form para o restante + `useState` local para seleção/distribuição (evita re-render pesado do form).
- Tudo respeita `useBrandGuard` (brand_id + branch_id) e o padrão de `.select()` em updates.

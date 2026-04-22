

# Reorganizar criação de temporada: definir séries antes das datas e refletir tamanho ao vivo

## Diagnóstico do que está acontecendo

Olhando o print e o código, dois problemas se combinam:

1. **Ordem invertida no formulário.** O modal "Nova Temporada" está nesta sequência:
   1. Informações básicas (datas, modo de pontuação)
   2. Séries (quantidade de motoristas)
   3. Prêmios
   4. Revisão

   Ou seja, o empreendedor é obrigado a escolher datas **antes** de definir quantos motoristas haverá. Mas é o tamanho da maior série que determina a duração mínima da Classificação. Conceitualmente está fora de ordem.

2. **O aviso não atualiza ao vivo quando você muda o tamanho.** Em `EditorSeries.tsx`, os campos de tamanho/sobem/descem usam `form.register(...)` sem `valueAsNumber` e sem `shouldValidate` no `onChange`. Como o `useMemo` em `EditorInformacoesBasicas.tsx` depende de `form.watch("series")`, ele só recalcula quando o RHF re-renderiza — o que acontece tarde demais. Por isso, ao mudar de 16 para 20, o banner continua dizendo "16 motoristas" e a validação fica defasada.

## O que vou ajustar

### 1. Inverter a ordem das seções do formulário
A nova sequência será:
1. **Séries** (tamanho dos motoristas, sobem/descem)
2. **Informações básicas** (nome, mês, ano, datas, modo de pontuação)
3. **Prêmios**
4. **Revisão**

Assim, quando o empreendedor chega na seção de datas, a duração mínima já reflete corretamente o número real de motoristas configurado.

### 2. Tornar o tamanho das séries reativo de verdade
Em `EditorSeries.tsx`, todos os inputs numéricos (`size`, `promote_count`, `relegate_count`) passarão a usar:
- `valueAsNumber: true` (para que o `watch` retorne número, não string)
- `onChange` que dispara `form.trigger(["series", "classificationEndsAt"])` para forçar revalidação imediata

### 3. Reforçar o `useEffect` de propagação no editor de datas
Em `EditorInformacoesBasicas.tsx`, o `useEffect` que recalcula a duração mínima passará a observar também a **maior série** (não só `classStart` e `duracaoMinima`), garantindo que ao mudar de 16 para 20 o `classificationEndsAt` seja empurrado para o novo mínimo automaticamente.

### 4. Pequeno ajuste textual no banner
Quando `classStart`/`classEnd` ainda não foram preenchidos (porque o usuário está vindo da seção de séries primeiro), o banner mostra apenas a recomendação ("Esta temporada precisa de no mínimo X dias…") sem o trecho "Janela atual: Y dias", que só aparece quando há datas escolhidas.

## Arquivos que serão ajustados

- `src/features/campeonato_duelo/components/empreendedor/FormCriarTemporada.tsx`
  - inverter a ordem dos `AccordionItem`: Séries (1) → Informações básicas (2) → Prêmios (3) → Revisão (4)
  - atualizar numeração e ícones nos títulos (1. Séries, 2. Informações básicas, etc.)
  - ajustar `defaultValue` do Accordion para o novo conjunto de chaves

- `src/features/campeonato_duelo/components/empreendedor/EditorSeries.tsx`
  - adicionar `valueAsNumber: true` em `size`, `promote_count` e `relegate_count`
  - adicionar `onChange` que dispara `form.trigger` para revalidar dependências em tempo real

- `src/features/campeonato_duelo/components/empreendedor/EditorInformacoesBasicas.tsx`
  - incluir `maiorSerie` (ou um hash de `series.map(s.size)`) nas dependências do `useEffect` de propagação
  - garantir que o banner trate o caso "ainda sem datas" sem mostrar "Janela atual: 0 dias"

## Resultado esperado

- Ao abrir o modal, o empreendedor primeiro define **quantos motoristas**, depois define **quando começa**.
- Ao mudar o tamanho de 16 para 20, o banner imediatamente passa a dizer "20 motoristas" e a duração mínima é recalculada (ex: 20 dias).
- Se as datas já estiverem preenchidas e ficarem curtas, o `classificationEndsAt` é automaticamente empurrado para frente, junto com `knockoutStartsAt` e `knockoutEndsAt`.
- A mensagem em vermelho "A Classificação precisa de no mínimo 20 dias…" deixa de aparecer em conflito com um banner que diz "16 motoristas".

## Detalhes técnicos

O bug raiz do "16 fixo" é o `register` sem `valueAsNumber`. No RHF, sem essa flag o valor fica como string, e o `watch("series")` devolve `[{ size: "20", ... }]`. O helper `calcularDuracaoMinimaClassificacao` faz `Number(s.size)`, então funciona — mas o `useMemo` só dispara quando o objeto referenciado muda, o que pode atrasar um ciclo.

Forçar `valueAsNumber: true` + `form.trigger` no `onChange` resolve os dois lados: o estado vira número imediatamente e a revalidação cascata acontece no mesmo evento.

## Risco e rollback

- **Risco baixo**: mudanças concentradas em ordem de seções e flags do RHF.
- **Rollback**: restaurar a ordem original do `Accordion` e remover `valueAsNumber`/`form.trigger` dos inputs de série.


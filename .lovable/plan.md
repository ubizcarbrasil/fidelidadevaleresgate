

# Calcular automaticamente a duração da Classificação e do Mata-mata em função das séries

## Por que isso é necessário

Hoje o empreendedor escolhe livremente as datas de Classificação e Mata-mata, mas a Fase 1 (Classificação) precisa ter dias suficientes para que **todos os motoristas se enfrentem**:

- **Modo "Confronto diário"** (round-robin): em uma série de N motoristas, cada dia um motorista enfrenta um adversário diferente. Para todos cruzarem entre si, são necessários **N−1 dias** (ou N se N for ímpar, com folga).
- **Modo "Pontos corridos"**: não há regra matemática de confronto, mas mantemos um mínimo razoável (igual ao maior tamanho de série) para que a corrida por pontos seja justa.

Além disso, o **Mata-mata só pode começar depois** que a fase de grupos terminar — hoje isso é validado, mas não calculado automaticamente.

## O que vou ajustar

### 1. Calcular a duração mínima da Classificação
Com base na **maior série** configurada (ex: A=16, B=12, C=8 → maior = 16):

- **Confronto diário**: duração mínima = `maior_serie − 1` dias
- **Pontos corridos**: duração mínima = `maior_serie` dias (mínimo de 7)

Exemplo: série A com 16 motoristas em modo round-robin → Classificação deve durar pelo menos **15 dias**.

### 2. Ajustar automaticamente o fim da Classificação
Sempre que o usuário:
- alterar o **tamanho de uma série**
- alterar o **modo de pontuação** (pontos corridos ↔ confronto diário)
- alterar o **início da Classificação**

…o sistema recalcula o `classificationEndsAt` para garantir a duração mínima, **só empurrando para frente** (nunca encurtando manualmente um período válido maior).

### 3. Ajustar automaticamente o início e o fim do Mata-mata
Quando o fim da Classificação for empurrado:

- `knockoutStartsAt` é movido para **o dia seguinte** ao novo fim da Classificação
- `knockoutEndsAt` é empurrado para manter pelo menos o intervalo atual entre início e fim do mata-mata (ou um mínimo padrão, ex: 7 dias)

Isso elimina o estado "datas inconsistentes" que o usuário enfrentou.

### 4. Mostrar a duração calculada na tela
No bloco da Fase 1 vou exibir um aviso informativo:

> "Esta temporada precisa de no mínimo **15 dias** de classificação para que todos os 16 motoristas da Série A se enfrentem (modo Confronto diário)."

E no bloco do Mata-mata:

> "O Mata-mata começa automaticamente após o fim da Classificação. Você pode estender a data final, mas não antecipá-la."

### 5. Bloquear "encurtamentos" inválidos no calendário
Os atributos `min` dos inputs já impedem datas anteriores; vou reforçar com:

- `min` dinâmico no `classificationEndsAt` = início da classificação + duração mínima calculada
- `min` no `knockoutStartsAt` = fim da classificação + 1 dia (já existe, manter)
- `min` no `knockoutEndsAt` = início do mata-mata + 1 dia (já existe, manter)

## Arquivos que serão ajustados

- `src/features/campeonato_duelo/utils/utilitarios_campeonato.ts`
  - novo helper `calcularDuracaoMinimaClassificacao(series, scoringMode): number` (em dias)
  - novo helper `calcularFimMinimoClassificacao(inicio, dias): string`

- `src/features/campeonato_duelo/components/empreendedor/EditorInformacoesBasicas.tsx`
  - ler `series` e `scoringMode` do formulário
  - calcular duração mínima e aplicar como `min` no input do fim da Classificação
  - autoajustar `classificationEndsAt`, `knockoutStartsAt` e `knockoutEndsAt` quando a duração mínima mudar (via `useEffect`)
  - exibir banner informativo com a duração calculada e o motivo

- `src/features/campeonato_duelo/components/empreendedor/EditorSeries.tsx`
  - ao alterar `size` de uma série, disparar revalidação do formulário (já acontece via `register`, garantir `shouldValidate`)

- `src/features/campeonato_duelo/schemas/schema_criar_temporada.ts`
  - adicionar validação no `superRefine` que checa se `classificationEndsAt − classificationStartsAt ≥ duração_mínima`, com mensagem clara em português

## Resultado esperado

- Ao definir o tamanho das séries, a tela já sugere automaticamente a janela mínima da Classificação.
- Ao trocar o modo de pontuação para "Confronto diário", o fim da Classificação se ajusta sozinho se necessário.
- O Mata-mata sempre começa **depois** da Classificação, sem que o usuário precise corrigir manualmente.
- O empreendedor entende **por que** aquela duração mínima foi aplicada (banner explicativo).

## Detalhes técnicos

Lógica do round-robin "1 confronto por dia":
- N par → cada motorista joga N−1 dias (basta N−1 rodadas)
- N ímpar → cada rodada um motorista folga; ainda são N−1 rodadas no mínimo

Como simplificação operacional, vou usar **N−1 dias** para `daily_matchup` e **N dias (mínimo 7)** para `total_points`.

A propagação será feita com `useEffect` observando `[series, scoringMode, classificationStartsAt]`, sempre **empurrando para frente** (nunca puxando para trás), preservando configurações manuais maiores.

## Risco e rollback

- **Risco baixo**: lógica concentrada em UX e validação do formulário de criação.
- **Rollback**: remover os `useEffect` de propagação e voltar à validação manual atual.


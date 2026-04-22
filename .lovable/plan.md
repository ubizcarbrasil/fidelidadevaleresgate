
# Tornar a escolha de datas do Campeonato clara e previsível no mobile

## O que está acontecendo hoje

A tela não está “bloqueando uma data aleatória” por erro do calendário. O que acontece é que existe uma regra de validação entre as fases:

- **Fim da Classificação** deve acontecer antes do **Início do Mata-mata**
- **Fim do Mata-mata** deve acontecer depois do **Início do Mata-mata**

Na sua screenshot, o sistema está com esta combinação:

- Classificação termina em **21/05/2026**
- Mata-mata começa em **22/05/2026**
- Mas o Mata-mata termina em **30/04/2026**

Ou seja: o **fim do mata-mata ficou antes do início**, por isso aparece o erro em vermelho e o envio fica travado. Hoje a interface valida isso, mas **não explica bem nem guia a seleção**.

## O que vou ajustar

### 1. Explicar a regra diretamente na tela
No bloco de datas, vou deixar a orientação mais explícita:

- Fase 1 precisa terminar antes da Fase 2 começar
- A data final do mata-mata precisa ser depois da data inicial
- Se a data ficar incoerente, mostrar mensagem simples em português claro

### 2. Restringir o calendário para evitar combinações inválidas
Vou configurar os campos `type="date"` com limites dinâmicos:

- **Fim da Classificação** não pode ser antes do **Início da Classificação**
- **Início do Mata-mata** não pode ser no mesmo dia ou antes do **Fim da Classificação**
- **Fim do Mata-mata** não pode ser antes do **Início do Mata-mata**

Assim, no mobile, o calendário já abre mais “guiado”, reduzindo erro antes mesmo da validação.

### 3. Autoajustar datas quando uma dependência mudar
Quando o usuário mudar uma data que quebra a sequência, a tela poderá ajustar o próximo campo automaticamente, por exemplo:

- se mudar o **fim da classificação**, o **início do mata-mata** sobe para o dia seguinte, se necessário
- se mudar o **início do mata-mata**, o **fim do mata-mata** sobe para a mesma data ou posterior, se necessário

Isso evita o estado confuso em que a pessoa escolhe uma data válida isoladamente, mas outra data antiga continua inválida.

### 4. Melhorar o feedback visual no mobile
Vou destacar melhor qual campo está causando o conflito e trocar mensagens genéricas por mensagens específicas, por exemplo:

- “O mata-mata precisa começar depois do fim da classificação.”
- “O fim do mata-mata precisa ser depois do início do mata-mata.”

### 5. Revisar a mensagem final de bloqueio do botão
Se ainda houver erro, o botão “Criar temporada” continua bloqueado, mas com feedback coerente com o problema atual — sem parecer que o calendário não funciona.

## Arquivos que serão ajustados

- `src/features/campeonato_duelo/components/empreendedor/EditorInformacoesBasicas.tsx`
  - adicionar `min` / `max` dinâmicos nos campos de data
  - melhorar mensagens e comportamento reativo entre campos

- `src/features/campeonato_duelo/schemas/schema_criar_temporada.ts`
  - ajustar textos de validação para ficarem mais claros e específicos

- `src/features/campeonato_duelo/utils/utilitarios_campeonato.ts`
  - adicionar helpers de comparação/ajuste de datas, se necessário, para manter a lógica limpa

## Resultado esperado

Na prática, você vai conseguir escolher as datas com muito mais clareza porque:

- o calendário vai orientar melhor a ordem correta
- a tela vai explicar por que uma combinação não pode
- o formulário vai evitar estados quebrados
- no mobile, a experiência deixa de parecer “travada” e passa a ser previsível

## Detalhes técnicos

Hoje a validação existe em dois níveis:

- no componente `EditorInformacoesBasicas.tsx`, com aviso reativo entre **fim da classificação** e **início do mata-mata**
- no `schema_criar_temporada.ts`, com validação final:
  - `classificationStartsAt < classificationEndsAt`
  - `classificationEndsAt < knockoutStartsAt`
  - `knockoutStartsAt < knockoutEndsAt`

O problema principal não é a regra de negócio, e sim a **UX da seleção**: os inputs de data ainda não usam limites encadeados, então a pessoa consegue montar uma combinação inconsistente sem perceber imediatamente.

## Risco e rollback

- **Risco baixo**: mudança concentrada em UX e validação do formulário
- **Rollback**: remover os limites dinâmicos e voltar ao comportamento atual caso necessário

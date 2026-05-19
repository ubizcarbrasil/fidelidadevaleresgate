Diagnóstico encontrado:

- O problema não é o seu login de empreendedor.
- O backend tem sim uma temporada ativa invisível/zumbi bloqueando a criação:
  - Nome: Maio 2026
  - ID: a9f2b1a5-de38-45b3-a478-aafc10173218
  - Status técnico: phase = classification, cancelled_at = null
  - Cidade/branch: aa1e7a2c-59e2-4eca-a39f-008412cfed09
  - Ela não tem motoristas nem séries materializadas: 0 motoristas e 0 séries.
- Existem 4 temporadas no banco:
  - 1 ativa: Maio 2026
  - 3 canceladas: Maio 2026, Maio 2026 e Janeiro 2027
- A função de cancelar existe corretamente agora no backend:
  - campeonato_cancel_season(p_season_id uuid, p_reason text)
- O índice único também está no formato correto para permitir recriar temporada cancelada:
  - único apenas quando cancelled_at IS NULL

Causa provável:

A temporada Maio 2026 foi recriada em 19/05/2026 às 16:05 UTC e ficou ativa em classificação, porém sem distribuição/séries. Como ela está ativa no banco, o pre-check do código está correto ao bloquear outra Maio 2026. O que parece estar falhando é a visibilidade/gestão dela no painel, porque o empreendedor não percebe essa temporada ativa ou não consegue cancelá-la claramente.

Plano de correção:

1. Corrigir a camada de listagem/histórico do empreendedor para garantir que temporadas ativas órfãs apareçam de forma explícita no histórico e no card ativo.
2. Ajustar o painel para destacar quando a temporada ativa existe mas está sem séries/motoristas, mostrando ação clara de cancelar ou distribuir motoristas.
3. Ajustar a lista de histórico para mostrar dados de cidade/branch mesmo quando a RPC não retorna branch_name, evitando parecer que a temporada não pertence à cidade atual.
4. Melhorar a mensagem de bloqueio da criação para incluir o ID/nome da temporada ativa e orientar o usuário a cancelar no histórico.
5. Após aprovado, posso também executar a correção operacional no banco cancelando especificamente a temporada zumbi Maio 2026, se você quiser liberar a criação imediatamente.
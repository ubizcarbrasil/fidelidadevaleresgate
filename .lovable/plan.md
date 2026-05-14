Diagnóstico encontrado:

- A tela está enviando a cidade correta para o backend: `p_branch_id = 601882d7-bf11-4b49-afd1-728d54232ed3`.
- Essa cidade é de fato `Leme - SP`.
- A temporada ativa `Maio 2026` também está vinculada a `Leme - SP`.
- O total exibido não vem de outra cidade: existem hoje 2.412 clientes ativos com `[MOTORISTA]` no nome cadastrados em Leme, e 2.407 já foram alocados na temporada.
- A distribuição está tecnicamente filtrada por cidade, mas a regra atual é ampla demais: ela considera qualquer cliente ativo de Leme com `[MOTORISTA]` no nome, inclusive sem corrida recente, e joga quase todos para a Série C.

Plano de correção:

1. Ajustar a regra de elegibilidade da distribuição do Campeonato
   - Manter o filtro obrigatório por cidade.
   - Deixar de incluir todos os motoristas só por terem `[MOTORISTA]` no nome.
   - Considerar elegível apenas motorista da cidade com corrida finalizada recente no período configurado, preservando exceção apenas para motoristas novos se essa regra já fizer sentido para o negócio.

2. Corrigir o total exibido nos KPIs
   - O card “Motoristas” deve contar os motoristas realmente elegíveis/participantes da temporada da cidade selecionada.
   - Evitar mostrar a base inteira importada quando a cidade tem milhares de cadastros históricos.

3. Corrigir “Distribuir motoristas”
   - Atualizar a RPC de semeadura para não alocar automaticamente milhares de motoristas inativos na Série C.
   - Garantir que a Edge Function `admin-brand-actions` continue chamando a versão correta da RPC.

4. Verificar dados após a correção
   - Conferir no banco quantos motoristas de Leme são elegíveis pela regra nova.
   - Conferir que os KPIs deixam de mostrar 2.407 quando a cidade selecionada é Leme.
   - Conferir que A/B/C passam a refletir apenas os motoristas elegíveis/participantes.

Observação importante:

- Se a temporada atual já foi semeada com 2.407 motoristas, além da correção da regra será necessário limpar/resemear essa temporada específica ou criar uma ação de reprocessamento para remover os alocados indevidamente. Vou tratar isso na implementação para não deixar a tela presa no número antigo.
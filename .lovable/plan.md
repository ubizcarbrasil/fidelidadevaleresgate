## Diagnóstico

O problema está no código/backend, não no login do empreendedor.

O que encontrei:
- A temporada **foi criada** no banco: `Maio 2026`, fase `classification`, cidade `aa1e7a2c...`.
- A distribuição automática **alocou 74 motoristas** em `campeonato_tier_memberships`.
- Porém a tela do empreendedor lê as séries usando `campeonato_season_standings`, e essa tabela ficou com **0 motoristas**.
- Resultado: a UI mostra mensagens contraditórias:
  - “temporada criada”
  - “sem motoristas no campeonato”
  - botão “Distribuir motoristas agora”
  - ao clicar, retorna “já foi semeada”, porque a distribuição já marcou `tier_seeding_completed_at`.

Além disso, o modo automático ignora a seleção manual/top 60 feita na tela: ele mostra a seleção no preview, mas o backend redistribui sozinho por regra própria ao criar.

## Plano de correção

1. **Corrigir a função de seeding no banco**
   - Atualizar `campeonato_seed_initial_tier_memberships` para, ao distribuir motoristas nas séries, também criar linhas iniciais em `campeonato_season_standings` com 0 pontos.
   - Assim o dashboard, cards de série e KPIs enxergam imediatamente os motoristas alocados.

2. **Tornar o seeding idempotente de verdade**
   - Ajustar `campeonato_materialize_and_seed_season` para não tratar “já foi semeada” como erro.
   - Se a temporada já foi semeada, retornar sucesso com contagem real de séries, motoristas alocados e standings.
   - Isso elimina o erro ao clicar de novo em “Distribuir motoristas agora”.

3. **Corrigir a leitura do dashboard**
   - Atualizar `brand_get_campeonato_dashboard` e `brand_get_season_summary` para contarem motoristas por `campeonato_tier_memberships`, não só por `campeonato_season_standings`.
   - O ranking/top continua usando standings, mas a contagem de motoristas passa a refletir os motoristas realmente inscritos nas séries.

4. **Corrigir o alerta da UI**
   - Ajustar a tela para mostrar “distribuir motoristas agora” apenas quando não houver séries ou não houver memberships.
   - Se já houver motoristas alocados mas ainda sem pontuação, mostrar texto correto como “motoristas distribuídos, aguardando corridas pontuarem”, em vez de “sem motoristas”.

5. **Reparar a temporada já criada**
   - Criar os standings iniciais para a temporada `Maio 2026` já existente, com base nos 74 motoristas já alocados.
   - Isso deve fazer a temporada aparecer corretamente sem precisar recriar tudo.

6. **Validar**
   - Confirmar no banco que a temporada ativa tem:
     - séries criadas
     - motoristas alocados
     - standings iniciais criados
   - Confirmar que o dashboard não deve mais mostrar “sem motoristas” nem erro de “já foi semeada”.

## Arquivos/áreas afetadas

- Migrations SQL do campeonato.
- Serviço de temporada do empreendedor.
- Tela `pagina_campeonato_empreendedor.tsx`.
- Tipagens/normalização de dados do dashboard, se necessário.
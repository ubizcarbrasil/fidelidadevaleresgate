## Diagnóstico

O app do motorista não mostra o card **Campeonato** porque há dois problemas separados:

1. A consulta de módulos do painel do motorista usa `public_brand_modules_safe.module_key`, mas essa coluna não existe na view atual. Isso gera erro 400 e pode impedir o hub do motorista de carregar corretamente.
2. A função que busca a temporada do motorista (`driver_get_pending_or_active_season`) ainda considera temporadas `cancelled` como ativas quando o motorista já foi distribuído. No caso verificado, ela retorna **Junho 2026** com fase `cancelled`, em vez de ignorar essa temporada e cair na temporada válida.

## Plano de correção

1. **Ajustar a leitura de módulos no `DriverPanelPage`**
   - Trocar a query atual de `public_brand_modules_safe` para buscar os módulos com join em `module_definitions`.
   - Resolver corretamente as chaves `driver_hub` e `affiliate_deals`.
   - Garantir fallback seguro: se a leitura pública falhar, o hub não deve esconder o app inteiro.

2. **Corrigir a função de temporada do motorista no banco**
   - Atualizar `driver_get_pending_or_active_season` para ignorar sempre temporadas com `phase = 'cancelled'` e `cancelled_at` preenchido, tanto no caminho normal quanto no fallback de “distribuição pendente”.
   - Isso impede que temporada cancelada apareça como ativa no app do motorista.

3. **Corrigir bloqueios de “temporada ativa” que ainda contam canceladas**
   - Revisar as RPCs de troca de formato que usam `phase <> 'finished'` e ajustar para `phase NOT IN ('finished','cancelled')` com `cancelled_at IS NULL`.
   - Isso corrige a mensagem incorreta de “já tem temporada ativa” quando só há temporada cancelada.

4. **Validar no preview**
   - Abrir o app do motorista para a marca Ubiz/Leme.
   - Confirmar que o hub carrega sem erro 400.
   - Confirmar que o card **Campeonato** aparece quando a flag e o formato estão ativos.
   - Confirmar que a tela do campeonato não mostra temporada cancelada como ativa.
Plano para destravar a criação da temporada:

1. Corrigir a regra no banco
- Trocar a restrição única atual de `campeonato_seasons` que bloqueia qualquer nova temporada com mesmo mês/ano/cidade.
- Substituir por um índice único parcial que só bloqueia temporadas não canceladas (`cancelled_at IS NULL`).
- Resultado: temporada cancelada deixa de impedir uma nova temporada no mesmo mês/cidade.

2. Corrigir a materialização das séries
- Tornar `campeonato_materialize_and_seed_season` idempotente para séries já parcialmente criadas.
- Evitar erro de chave duplicada em `campeonato_season_tiers` usando upsert/ignore por `(season_id, tier_order)`.
- Resultado: se a criação ou distribuição for tentada duas vezes, não quebra com duplicidade.

3. Ajustar o frontend para refletir a regra real
- Manter as consultas de conflito considerando apenas temporadas não canceladas.
- Melhorar o tratamento de erro de duplicidade para não dizer “cancele/exclua” quando o problema for índice antigo/temporada cancelada.
- Depois de cancelar, remover/refazer imediatamente as queries de conflito e sobreposição.

4. Validar
- Conferir no banco que as temporadas de Maio/2026 canceladas existem, mas não bloqueiam.
- Testar a criação novamente para a mesma cidade/mês.
- Verificar que a mensagem da tela desaparece e que a criação não cai mais em erro 500/duplicidade.
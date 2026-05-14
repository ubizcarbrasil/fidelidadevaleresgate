## Diagnóstico

- No backend, para Leme, **não existe temporada ativa real**: a RPC de KPIs já retorna `has_active_season: false` e a consulta direta não encontrou temporadas com `phase` ativa e `cancelled_at` vazio.
- O aviso de “temporada ativa/existente” vem de consultas de conflito por mês/ano que ainda olham temporadas canceladas porque buscam qualquer registro de `campeonato_seasons` do mês, sem filtrar `cancelled_at`/`phase`.
- A criação automática ainda usa `duelo: 24h`, então a Classificação termina no dia seguinte. Isso contradiz o fluxo “fase de grupos / todos contra todos”.

## Plano de correção

1. **Conflito de temporada existente**
   - Ajustar as checagens de conflito em `FormCriarTemporada.tsx`, `EditorInformacoesBasicas.tsx` e `FormCriarTemporadaAutomatico.tsx` para considerar como bloqueio apenas temporadas **não canceladas**.
   - Assim temporadas canceladas/resetadas aparecem como histórico, mas não bloqueiam criação nem são tratadas como ativa.

2. **Status exibido no formulário**
   - Corrigir o rótulo de status para usar `finished` como finalizada, e não `completed`.
   - Evitar mensagem dizendo “ativa” quando o registro tem `cancelled_at` preenchido.

3. **Duração automática da Classificação**
   - Trocar o padrão automático de Classificação de `24h` para uma duração coerente com fase de grupos.
   - Em vez de usar só o número digitado, calcular um mínimo com base no maior tamanho de série:
     - para “todos contra todos” (`daily_matchup`), mínimo de `maior série - 1` dias;
     - para pontos corridos, mínimo já existente de pelo menos `maior série` dias, com piso de 7 dias.
   - No modo automático atual, com série padrão de 16 motoristas, a Classificação não terminará no dia seguinte; será estendida para uma janela mínima coerente antes do mata-mata.

4. **Validação visual no resumo automático**
   - Atualizar o resumo calculado para refletir a data final ajustada e manter o botão “Criar temporada” bloqueado apenas se houver conflito real não cancelado.

5. **Validação final**
   - Verificar novamente no backend que Leme não tem temporada ativa.
   - Validar que os cálculos automáticos deixam a classificação com duração mínima correta e que temporadas canceladas não bloqueiam uma nova criação.
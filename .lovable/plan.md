## Diagnóstico

Há dois problemas separados no Campeonato de Leme:

1. **Erro ao clicar em “Distribuir motoristas agora”**
   - A função de distribuição está bloqueando re-seed quando existe temporada anterior já semeada na mesma cidade.
   - Em Leme existe uma temporada anterior de **Maio 2026** já semeada, então a temporada nova criada sem distribuição cai nesse erro:
     `A cidade ... já tem temporada anterior semeada — use promoção/rebaixamento, não re-seed`.

2. **Contagem de 2.407 motoristas**
   - O painel principal ainda busca o dashboard por **marca**, sem passar `branchId`.
   - Além disso, Leme realmente tem muitos clientes marcados como `[MOTORISTA]` no cadastro: encontrei **2.412 motoristas ativos** vinculados ao branch de Leme, sendo **2.270 criados em 20/04/2026**.
   - Então parte da contagem vem de dado real do banco, e parte da tela ainda pode estar usando RPC sem filtro de cidade.

## Plano de correção

### 1. Filtrar o dashboard do empreendedor por cidade
- Alterar o fluxo `useDashboardCampeonato` / `obterDashboardCampeonato` para receber `branchId`.
- Atualizar a RPC `brand_get_campeonato_dashboard` para aceitar `p_branch_id` opcional.
- Garantir que temporada ativa, séries, standings e totais sejam calculados somente para a cidade selecionada.
- Atualizar `PaginaCampeonatoEmpreendedor` para chamar o dashboard com `brandId + branchId`.

### 2. Corrigir a ação “Distribuir motoristas agora”
- Ajustar a lógica para não tentar “seed inicial” quando a cidade já tem temporada anterior semeada.
- Quando houver temporada anterior, usar o fluxo correto de **promoção/rebaixamento** ou criar uma função segura que materialize as séries da nova temporada e migre os motoristas da temporada anterior para ela.
- Retornar mensagem clara no botão quando for continuação de temporada, em vez de erro genérico.

### 3. Evitar temporada cancelada aparecer como ativa
- Revisar `brand_get_campeonato_dashboard` para ignorar temporadas com `cancelled_at IS NOT NULL`, não apenas `phase != cancelled`.
- Isso evita casos como “Julho 2026” aparecer com `phase = classification` mesmo estando cancelada.

### 4. Invalidar os caches corretos depois da distribuição
- Atualizar invalidação para incluir as queries com `branchId`.
- Incluir também os KPIs `empreendedor-campeonato-kpis` para refletir a distribuição imediatamente.

### 5. Validar no banco
- Conferir para Leme:
  - temporada ativa correta;
  - tiers criadas;
  - memberships por série;
  - contagem do dashboard igual ao escopo da cidade;
  - erro da Edge Function removido.

## Observação importante

A contagem alta de Leme não parece ser só bug visual: o banco contém milhares de registros ativos com `[MOTORISTA]` no branch de Leme. Depois de corrigir o filtro da tela, se você quiser, podemos fazer uma segunda etapa para auditar/importação desses motoristas e identificar se foram vinculados à cidade errada.
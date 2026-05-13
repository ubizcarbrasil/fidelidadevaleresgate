Diagnóstico encontrado:

- Existe temporada criada no banco para Leme:
  - Maio 2026: não cancelada, séries distribuídas, 2407 motoristas.
  - Julho 2026: não cancelada, sem séries, 0 motoristas.
- A tela mostra informações contraditórias porque usa duas fontes diferentes:
  - `brand_get_campeonato_dashboard` encontra uma temporada, mas escolhe pela marca inteira e pela mais recente criada.
  - `brand_get_campeonato_kpis` está quebrando com `relation "public.duelo_tiers" does not exist`, então o bloco operacional cai em “Sem temporada ativa”.
- A criação de nova temporada também está bloqueando meses já criados mesmo quando a temporada for cancelada, porque a regra única atual considera também temporadas canceladas.
- No app do motorista, o atalho do campeonato depende de leitura da tabela `brands`; para motorista/anon isso pode falhar. Além disso, quando abre pelo hub, ainda usa o painel legado `CampeonatoMotoristaPanel`, não o layout novo de campeonato (`PaginaCampeonatoMotorista`).

Do I know what the issue is? Sim. O problema é combinação de escopo errado por cidade, KPI quebrado, regra de duplicidade rígida demais e app do motorista ainda apontando para o painel antigo.

Plano de correção:

1. Corrigir backend do campeonato por cidade
   - Criar/ajustar RPCs branch-scoped para dashboard e KPIs do campeonato.
   - Filtrar por `brand_id` + `branch_id`, ignorando temporadas canceladas.
   - Corrigir o KPI para usar `duelo_season_tiers` em vez de `duelo_tiers`.
   - Retornar um estado consistente: temporada ativa/próxima, séries e KPIs sempre da mesma cidade.

2. Corrigir regra de duplicidade de temporada
   - Trocar a regra única atual para permitir recriar o mesmo mês/ano depois que a temporada antiga for cancelada.
   - Ajustar as checagens do formulário para ignorar temporadas canceladas.
   - Manter bloqueio contra sobreposição de períodos apenas para temporadas não canceladas.

3. Ajustar painel do empreendedor
   - Passar `branchId` para os hooks/serviços de dashboard e KPIs.
   - Fazer o topo operacional e o card da temporada usarem a mesma temporada resolvida.
   - Garantir que o botão/ação de encerrar temporada fique acessível quando houver uma temporada criada por engano.
   - Corrigir o aviso de chave duplicada em `ListaTemporadasAnteriores`.

4. Corrigir app do motorista
   - Fazer `useDueloCampeonatoHabilitado` ler a fonte pública segura da marca, para o motorista conseguir ver o atalho do campeonato.
   - Substituir o overlay legado do hub pelo layout novo de campeonato.
   - Adicionar estado correto no layout novo para: carregando, sem temporada, temporada criada aguardando distribuição, motorista sem série e campeonato operacional.
   - Preservar botão de voltar quando aberto pelo hub.

5. Validar
   - Conferir chamadas de rede para `brand_get_campeonato_kpis` sem erro 404.
   - Conferir que Leme não mostra mais “Sem temporada ativa” junto com uma temporada logo abaixo.
   - Conferir que o motorista vê o atalho “Campeonato” e abre o layout novo.

<presentation-actions>
<presentation-link url="https://docs.lovable.dev/tips-tricks/troubleshooting">Troubleshooting docs</presentation-link>
</presentation-actions>
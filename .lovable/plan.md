Vou corrigir diretamente os dois problemas reais encontrados no código:

1. **Esconder módulos desativados no painel do motorista**
   - Ajustar `DriverHomePage` para não enviar `showCityRedemptions` sempre ligado.
   - `Meus Resgates` só aparecerá quando `Resgate na Cidade` estiver ativo para a cidade.
   - `Comprar Pontos` continuará dependendo apenas de `enable_driver_points_purchase === true`.
   - `Resgate na Cidade` continuará dependendo de `is_city_redemption_enabled === true`.
   - Vou manter a regra do projeto: flags ausentes em `branch_settings_json` contam como desligadas.

2. **Corrigir entrada na tela do Campeonato**
   - Hoje o botão navega para `/motorista/campeonato` sem preservar `brandId`, e a rota só resolve a marca se estiver no domínio oficial. Em preview/app genérico isso cai em “Não foi possível identificar a marca”.
   - Vou alterar todas as navegações do painel do motorista para abrir `/motorista/campeonato?brandId=<marca>`.
   - Também vou preservar `sessionKey` quando existir, para não quebrar sessões administrativas/impersonadas.
   - O clique em notificações com `campeonato=1` seguirá a mesma regra.

3. **Evitar flash de módulo antes de carregar permissões**
   - A Home do motorista só será renderizada depois que os módulos da marca e a cidade efetiva estiverem resolvidos.
   - Isso evita exibir atalhos com base em estado parcial.

4. **Validação**
   - Verificar no código que os cards destacados ficam condicionados às flags certas.
   - Verificar que a URL do Campeonato sempre recebe `brandId` a partir da marca carregada.
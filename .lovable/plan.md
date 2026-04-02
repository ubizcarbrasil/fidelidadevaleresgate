
Objetivo: confirmar o que já foi feito do painel de cidade do ACHADINHOS Motorista, explicar por que você não está conseguindo entrar nesse perfil hoje e listar o que ainda precisa ser ajustado para fechar o fluxo.

Status do que já está implementado
1. Painel de cidade / escopo BRANCH existe
- O sistema já resolve `branch_admin` como console `BRANCH`.
- O layout já usa `BranchSidebar` para esse perfil.

2. Módulo visual separado no menu
- Já existe um grupo próprio “Achadinhos Motorista” no sidebar da cidade com:
  - Carteira de Pontos
  - Regras de Pontuação
  - Produtos de Resgate
  - Pedidos de Resgate
  - Motoristas
  - Manuais

3. Carteira de pontos da cidade existe
- Página `BranchWalletPage` já consulta `branch_points_wallet` e `branch_wallet_transactions`.
- Já existe recarga e histórico.
- A carteira também já é criada ao provisionar/franquear cidade.

4. Regra de pontos do motorista existe
- Página `DriverPointsRulesPage` já salva regras em `driver_points_rules`.

5. Menus de produtos, pedidos e motoristas existem
- `ProdutosResgatePage`
- `ProductRedemptionOrdersPage`
- `DriverManagementPage`

6. Dashboard da cidade existe parcialmente
- Já existe `BranchDashboardSection` com:
  - Corridas realizadas
  - Motoristas ativos
  - Pontos distribuídos
  - Pedidos de resgate
  - Saldo da carteira
  - Ranking de motoristas da cidade

7. Manuais do franqueado existem
- Já existe `gruposManuaisFranqueado` com manuais para:
  - carteira
  - regras
  - produtos
  - pedidos
  - motoristas
  - dashboard

8. Criação de acesso do franqueado existe
- Pelo cadastro de cidade (`BrandBranchForm`) já dá para criar o “Gestor da Cidade”.
- Pela tela de usuários (`UsersPage`) já dá para convidar `branch_admin` e vincular cidade.

9. Atalho no painel do empreendedor existe
- Já existe “Painel Franqueado” nos quick links do dashboard.
- Também existe bloco de “Acessos de Teste” quando a marca foi provisionada com contas teste.

Por que você não está achando como entrar
1. O painel de cidade não é aberto com a conta do empreendedor
- Hoje o empreendedor continua com escopo `BRAND`.
- Clicar no atalho “Painel Franqueado” não transforma o usuário em `branch_admin`.
- Para entrar de verdade no painel da cidade, precisa logar com outro usuário que tenha role `branch_admin` vinculada a uma `branch_id`.

2. As contas de teste não existem para toda marca
- O bloco “Acessos de Teste” só aparece quando a marca foi criada pelos fluxos de provisionamento que gravam `test_accounts`.
- Se a sua marca foi montada manualmente, esse bloco pode não existir.

Principais gaps que ainda faltam
1. Isolamento por cidade ainda está incompleto
- `DriverManagementPage`, `ProductRedemptionOrdersPage` e `ProdutosResgatePage` estão filtrando por `brand_id`, não por `branch_id`.
- Na prática, o franqueado pode acabar vendo dados da marca inteira, e não só da cidade dele.

2. Regras de pontuação ainda não estão travadas no escopo da cidade
- `DriverPointsRulesPage` deixa escolher filial.
- Para `branch_admin`, o correto é abrir já travado na cidade dele.

3. Guardas de rota estão inconsistentes com o módulo separado
- O menu da cidade usa `achadinhos_motorista`.
- Mas as rotas ainda usam módulos como `machine_integration` e `affiliate_deals`.
- Isso quebra a ideia de módulo apartado e pode esconder páginas mesmo quando o módulo da cidade estiver ativo.

4. Dashboard da cidade ainda não está 100% no formato pedido
- O bloco específico da cidade existe, mas o dashboard geral ainda mistura partes da visão da marca.
- O feed de “pontuação em tempo real da cidade dele” não está fechado como uma visão regional dedicada.

5. Manuais do franqueado não aparecem para o empreendedor no ADM
- Hoje os manuais do franqueado são liberados quando o escopo é `BRANCH`.
- O empreendedor não enxerga esse conjunto específico no ADM, embora esse tenha sido um pedido seu.

Plano para fechar o que falta
1. Corrigir o acesso ao perfil franqueado
- Garantir um fluxo claro para o empreendedor:
  - criar cidade + gestor
  - ou convidar usuário `branch_admin`
  - e ter um ponto visível para copiar login/senha ou abrir o acesso correspondente
- Se necessário, criar uma listagem de acessos por cidade no painel do empreendedor.

2. Unificar o módulo separado “Achadinhos Motorista”
- Ajustar todas as rotas do painel de cidade para usarem o mesmo módulo `achadinhos_motorista`.
- Parar de depender de `machine_integration` e `affiliate_deals` para páginas que pertencem ao painel do franqueado.

3. Fechar o isolamento real por cidade
- Aplicar `branch_id` nas páginas do franqueado:
  - regras
  - motoristas
  - produtos
  - pedidos
  - dashboard
- Remover seleção de outras cidades para `branch_admin`.

4. Finalizar o dashboard regional
- Deixar a home do `branch_admin` focada só na cidade dele.
- Incluir visão de:
  - resgates da cidade
  - pontuação de motoristas da cidade
  - motoristas da cidade
  - corridas realizadas
  - ranking regional
  - pontuação em tempo real regional

5. Liberar os manuais no lugar certo
- Manter manuais no painel do franqueado.
- Expor também esses manuais para o empreendedor dentro do ADM.

Como entrar hoje, no estado atual
1. Criar ou usar um usuário com role `branch_admin` e `branch_id` preenchido.
2. Fazer login com esse usuário separado.
3. Aí sim o sistema entra no console `BRANCH` e mostra o sidebar regional.

Resumo prático
- Sim: boa parte do painel já foi feita.
- Não: ainda não está totalmente fechado no acesso e no isolamento por cidade.
- O principal motivo de você “não achar como entrar” é que o painel da cidade depende de um login próprio `branch_admin`, não da conta do empreendedor.
- O que falta concluir de verdade é:
  - acesso guiado ao perfil
  - rotas do módulo separado
  - filtros por cidade
  - dashboard 100% regional
  - manuais visíveis também no ADM do empreendedor

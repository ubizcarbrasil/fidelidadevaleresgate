
## Fazer a opção aparecer de forma confiável

### Diagnóstico confirmado
O toggle já existe em `DriverPanelConfigPage`, então o problema é de acesso/visibilidade. Hoje há 4 bloqueios no código:

1. `src/components/consoles/BrandSidebar.tsx` oculta “Painel do Motorista” quando a marca não está com contexto `DRIVER` por causa de `scoringFilter: "DRIVER"`.
2. `src/App.tsx` protege `/driver-config` com `ModuleGuard moduleKey="machine_integration"`, criando um bloqueio circular: a pessoa precisa abrir a tela para ativar/configurar, mas a rota pode sumir antes.
3. `src/pages/BrandModulesPage.tsx` para empreendedor só mostra módulos que já têm vínculo em `brand_modules`; se não houver linha ainda, o módulo não aparece para ser ativado.
4. Para root admin, a página de módulos não reaproveita automaticamente a marca já aberta no contexto, então a lista pode ficar vazia até selecionar manualmente.

### Plano de implementação
1. **Liberar o acesso ao Painel do Motorista**
   - Remover o `scoringFilter: "DRIVER"` do item “Painel do Motorista” no sidebar da marca.
   - Ajustar a rota `/driver-config` para não depender apenas de `machine_integration`.

2. **Fazer o módulo aparecer na tela de Módulos**
   - Alterar `BrandModulesPage` para o empreendedor ver todos os módulos `customer_facing` e `!is_core`, mesmo sem registro prévio em `brand_modules`.
   - Manter a lógica de inserir em `brand_modules` na primeira ativação.

3. **Melhorar o fluxo do root admin**
   - Pré-selecionar automaticamente a marca atual quando o root estiver operando dentro do contexto de uma marca.
   - Melhorar o estado vazio com instrução clara quando nenhuma marca estiver selecionada.

4. **Reforçar o toggle direto**
   - Manter o card “Home do Motorista” no topo de `DriverPanelConfigPage`.
   - Ajustar o destaque visual/texto se necessário para ficar mais fácil de localizar.

### Arquivos envolvidos
- `src/components/consoles/BrandSidebar.tsx`
- `src/App.tsx`
- `src/pages/BrandModulesPage.tsx`
- `src/pages/DriverPanelConfigPage.tsx`

### Resultado esperado
A opção de ativar/desativar a Home do Motorista ficará visível e utilizável:
- no menu “Painel do Motorista”
- na tela “Módulos”

sem depender do scoring atual da marca, de um vínculo prévio no banco ou de seleção manual confusa da marca.

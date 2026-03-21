

## Plano: Corrigir link do Painel do Motorista e adicionar página de configuração

### Problemas identificados

1. **Link quebrado**: O `BrandSidebar` usa `currentBrandId` do `useBrandGuard`, que depende do `BrandContext`. Quando o contexto ainda não carregou, o `brandId` é vazio/undefined, gerando a URL `/driver?brandId=` — que resulta no erro "Parâmetro brandId é obrigatório".

2. **Falta página de configuração**: O empreendedor precisa de uma página interna para configurar o marketplace do motorista (categorias, layout, seções), não apenas um link externo.

### Implementação

**1. Corrigir o link externo no sidebar**
- Em `BrandSidebar.tsx`: garantir que o link só fique clicável quando `brandId` estiver disponível
- Alternativa: mudar de link externo para rota interna `/driver-config` que mostra configuração + botão "Visualizar"

**2. Criar página de configuração `DriverPanelConfigPage.tsx`**
- Rota interna `/driver-config` no painel do empreendedor
- Conteúdo:
  - Botão "Abrir Painel do Motorista" (abre `/driver?brandId=xxx` em nova aba)
  - Lista de categorias ativas de achadinhos com toggle on/off
  - Preview do link de compartilhamento para enviar aos motoristas
- Usa as tabelas `affiliate_deal_categories` e `affiliate_deals` já existentes

**3. Atualizar sidebar**
- Mudar o item do driver de link externo (`/driver-panel-link`) para rota interna (`/driver-config`)
- Remover a lógica especial de `isDriverLink` no `CollapsibleGroup`
- Manter ícone `Car` e label "Painel do Motorista"

**4. Atualizar `App.tsx`**
- Adicionar rota protegida `/driver-config` com `DriverPanelConfigPage`

### Arquivos envolvidos
- **Novo**: `src/pages/DriverPanelConfigPage.tsx`
- **Editar**: `src/components/consoles/BrandSidebar.tsx` — trocar link externo por rota interna
- **Editar**: `src/components/consoles/RootSidebar.tsx` — mesmo ajuste
- **Editar**: `src/App.tsx` — adicionar rota `/driver-config`

### Resultado
O empreendedor clica em "Painel do Motorista" no menu, abre uma página de configuração dentro do painel onde pode ver/gerenciar categorias e abrir o marketplace em nova aba com o `brandId` correto.


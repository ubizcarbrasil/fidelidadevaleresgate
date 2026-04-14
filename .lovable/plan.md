

## Problema: Toggle do módulo "Home do Motorista" não aparece

### Causa raiz

O módulo `driver_hub` existe no banco e está ativo, mas há dois problemas:

1. **Para Root Admin**: a página de Módulos (`/brand-modules`) exige que o usuário selecione uma marca no dropdown antes de mostrar qualquer módulo. Sem selecionar, nada aparece.

2. **Falta ícone dedicado**: o módulo `driver_hub` não tem ícone no mapa `MODULE_ICONS`, usando o genérico `Blocks`, o que dificulta identificá-lo visualmente.

3. **Usabilidade**: o toggle está "escondido" dentro da página genérica de módulos. O ideal é ter também um **toggle direto** na configuração do painel do motorista.

### Solução

#### 1. Adicionar ícone do módulo
Adicionar `driver_hub: Home` (ou `LayoutDashboard`) ao mapa `MODULE_ICONS` em `BrandModulesPage.tsx`.

#### 2. Adicionar toggle direto na config do painel do motorista
Verificar se existe uma página de configuração do painel do motorista (tipo `DriverPanelConfigPage`) e adicionar um switch "Ativar Home do Motorista" diretamente nela, para que o empreendedor/root admin não precise ir até a página de módulos.

#### 3. Garantir visibilidade na página de módulos
- O módulo já está com `customer_facing: true`, `is_core: false` e `is_active: true`
- Para root admin: funciona ao selecionar a marca no dropdown
- Para brand admin: já deve aparecer (o registro existe em `brand_modules`)

### Arquivos alterados

| Arquivo | Mudança |
|---------|---------|
| `src/pages/BrandModulesPage.tsx` | Adicionar `driver_hub` ao `MODULE_ICONS` |
| `src/pages/DriverPanelPage.tsx` ou config equivalente | Adicionar switch inline para ativar/desativar o hub diretamente |

### Resultado
O empreendedor verá o toggle "Home do Motorista" tanto na página de módulos quanto diretamente na configuração do painel do motorista, com um ícone claro e identificável.




## Diagnóstico — Permissões do painel raiz não desaparecem do empreendedor

### Causa raiz (confirmada com leitura de código + query no banco)

A plataforma tem **dois sistemas de governança paralelos e desconectados**:

1. **Módulos** (`module_definitions` / `brand_modules` / `city_module_overrides`)
   - Controla **visibilidade do menu** do empreendedor via `useBrandModules` / `useResolvedModules`
   - Toda filtragem da `BrandSidebar.tsx` (linha 261) usa `isModuleEnabled(item.moduleKey)`
   - **Esse é o sistema que efetivamente esconde itens do menu**

2. **Permissões** (`permissions` / `brand_permission_config` / `brand_sub_permission_config`)
   - Tela onde você desativa: `/permissions-overflow` (`BrandPermissionOverflowPage.tsx`)
   - Salva linhas em `brand_permission_config` com `allowed_for_brand = false`
   - **Nenhum hook do projeto consome essa tabela na sidebar/guards do empreendedor**
   - Confirmação por busca: zero ocorrências de `brand_permission_config`, `allowed_for_brand` ou `useBrandPermissions` em qualquer hook/guard/sidebar
   - A função RPC `user_has_permission` existe mas só lê `user_permission_overrides` (overrides por usuário individual), não a config da marca

**Estado atual no banco**: 17 permissões salvas com `allowed_for_brand=false`, todas ignoradas pelo runtime.

### Por que o usuário vê isso como bug
O painel raiz oferece uma UI rica para "desativar permissões da marca" (com toggles, sub-itens, scoping por filial), mas o resultado desse trabalho não tem efeito nenhum no painel do empreendedor. O sistema está incompleto: a escrita funciona, a leitura nunca foi implementada.

### Pergunta antes de planejar a correção

Existem 3 caminhos legítimos. Preciso saber qual é a intenção do produto antes de escolher.

### Caminhos possíveis

**Caminho A — Conectar `brand_permission_config` ao runtime (completar o sistema)**
Implementar o consumo: criar `useBrandPermissions(brandId, branchId)`, usar em `BrandSidebar` como filtro adicional após `isModuleEnabled`, e em um novo `PermissionGuard` para rotas. Adicionar coluna `permission_key` opcional no `MENU_REGISTRY` para os itens que devem responder a permissão. Mudança grande (~6 arquivos), exige mapear cada item de menu para sua `permission_key`, risco médio de regredir telas.

**Caminho B — Esconder/depreciar a tela `/permissions-overflow`**
Se o controle real é feito por **módulos** (Central de Módulos da Fase 4.1a/4.3), a tela de permissões está duplicando função e confundindo. Esconder do menu raiz com aviso "use a Central de Módulos", manter dados intactos para futura ativação. Mudança pequena (~2 arquivos), zero risco de regressão.

**Caminho C — Refatorar `brand_permission_config` para escrever em `brand_modules`**
Quando o root desativar uma permissão cujo `permission_key` mapeie para um módulo (ex: `redemptions.read` → módulo `redemption_qr`), também desativar o `brand_modules` correspondente. Mantém a UI familiar e faz funcionar. Risco: mapeamento `permission_key → module_key` é manual e parcial (não há cobertura 1:1).

### Pergunta única
Antes de eu detalhar o plano de execução, qual é a intenção de produto?

- Você **espera** que desativar permissão no `/permissions-overflow` esconda menus do empreendedor? → **Caminho A** (completar a leitura)
- Ou esse painel ficou obsoleto depois que a Central de Módulos passou a existir, e ele só está confundindo? → **Caminho B** (esconder e migrar para módulos)
- Ou quer que as duas telas coexistam mas que mexer numa reflita na outra? → **Caminho C** (sincronização)

Sem essa decisão, qualquer plano que eu detalhe vai assumir intenção e arriscar fazer a coisa errada em produção com 42 usuários ativos.




## Plano: Traduzir nomes técnicos de permissões para português amigável

### Problema
A página de Permissões exibe chaves técnicas como `offers.approve`, `branches.create`, `brands.update` que nao sao compreensíveis para o usuario final. Os nomes dos módulos tambem aparecem em inglês (`offers`, `branches`, `brands`, etc.).

### Solução
Adicionar dois dicionários de tradução diretamente no `PermissionsPage.tsx`:

1. **MODULE_LABELS** -- traduz nomes de módulos:
   - `branches` -> "Cidades"
   - `brands` -> "Marcas"
   - `customers` -> "Clientes"
   - `domains` -> "Domínios"
   - `offers` -> "Ofertas"
   - `redemptions` -> "Resgates"
   - `stores` -> "Parceiros"
   - `vouchers` -> "Cupons"
   - `users` -> "Usuários"

2. **PERMISSION_LABELS** -- traduz chaves de permissão para ações em português:
   - `*.create` -> "Criar ..."
   - `*.read` -> "Visualizar ..."
   - `*.update` -> "Editar ..."
   - `*.delete` -> "Excluir ..."
   - `*.approve` -> "Aprovar ..."
   - (e demais combinações específicas encontradas)

### Alterações no arquivo

**`src/pages/PermissionsPage.tsx`**:
- Adicionar os dois objetos `MODULE_LABELS` e `PERMISSION_LABELS` no topo do arquivo
- Criar uma função `friendlyLabel(key)` que busca no dicionário ou gera um fallback legível
- Na tabela, substituir:
  - `{mod}` pelo label traduzido do módulo
  - `{p.key}` pelo label traduzido da permissão (mostrando a key técnica em fonte menor abaixo como referência)
  - Manter `{p.description}` como está, pois já vem do banco
- Na lista de Roles, traduzir o nome do role usando `ROLE_LABELS` já existente em `src/modules/auth/types.ts`

### Detalhes técnicos
- Os dicionários são constantes locais, sem necessidade de banco de dados
- Fallback: se uma key nao tiver tradução, exibe a key original formatada (replace `.` por ` > `, capitalize)
- Zero alterações no banco de dados


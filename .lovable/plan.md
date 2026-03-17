

## Plano: Remover todos os dados da marca "Urbano Norte"

### Contexto
A marca **Urbano Norte** (`8f76ce52-d6c0-4c90-af67-79957e97e477`) possui:
- 7.659 contatos CRM
- 481 clientes
- 50 ofertas
- 41 lojas
- 1 filial

### Ação
Chamar a Edge Function `admin-brand-actions` com `action: "delete_brand"` e o `brand_id` da Urbano Norte. Esta função já implementa a limpeza profunda de todas as tabelas dependentes (crm_contacts, customers, stores, offers, redemptions, branches, user_roles, etc.) antes de excluir a marca.

Alternativamente, se o usuário não estiver logado como root_admin no preview, executar a exclusão diretamente via SQL nas tabelas dependentes na ordem correta e depois remover a marca.

### Passos
1. Deletar dados de todas as tabelas filhas que referenciam `brand_id = '8f76ce52-...'` (seguindo a mesma ordem da Edge Function `admin-brand-actions`)
2. Limpar referências em `profiles` (selected_branch_id, brand_id)
3. Deletar branches, user_roles e finalmente a marca

Nenhuma alteração de código é necessária — apenas operação de dados.


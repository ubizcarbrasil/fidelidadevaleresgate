

## Diagnóstico

Entendi o problema. O botão **"Sincronizar CRM"** na página de Clientes faz o caminho **Clientes → CRM** (envia clientes com status PENDING para a tabela `crm_contacts`). Porém, você quer o caminho **inverso: CRM → Clientes** — ou seja, os contatos que você subiu no CRM devem aparecer como clientes no programa de fidelidade.

### Estado atual no banco

- **Ubiz Resgata**: 2 clientes (`crm_sync_status = NONE`), **0 contatos CRM**
- **Urbano Norte**: 7.659 contatos CRM, dos quais **7.657 não têm customer vinculado**
- O botão "Sincronizar CRM" **só faz o sentido inverso** (customer → crm_contact) e apenas para status `PENDING`

### Causa raiz

Não existe funcionalidade de **importar contatos CRM como clientes**. O fluxo atual é unidirecional.

---

## Plano: Sincronização CRM → Clientes

### 1. Adicionar lógica reversa no botão "Sincronizar CRM" (`CustomersPage.tsx`)

Atualmente o `syncToCrmMutation` busca customers com `crm_sync_status = PENDING` e cria `crm_contacts`. Vamos adicionar uma **segunda etapa** que faz o inverso:

1. Buscar `crm_contacts` da marca que **não possuem `customer_id`** (contatos órfãos)
2. Para cada contato, criar um registro em `customers` com:
   - `name`, `phone`, `cpf`, `email` do contato CRM
   - `brand_id` e `branch_id` do contato (ou branch padrão da marca)
   - `crm_contact_id` apontando para o contato
   - `crm_sync_status = "SYNCED"`
   - `customer_tier` calculado pelo `ride_count`
3. Atualizar o `crm_contact` com o `customer_id` recém-criado (back-link)
4. Exibir toast com contagem: "X contatos importados do CRM"

### 2. Tratar contatos sem branch

Contatos CRM podem ter `branch_id = null`. Nesse caso, usar a **primeira filial da marca** como fallback (já carregada na página via query de branches).

### 3. Melhorar feedback do botão

- Renomear o toast para indicar ambas as direções
- Se não houver pendências em nenhum sentido, exibir "Tudo sincronizado!"

### Arquivo alterado

- `src/pages/CustomersPage.tsx` — mutation `syncToCrmMutation` (linhas 82-120)

### Resultado esperado

Ao clicar "Sincronizar CRM", o sistema:
1. Envia customers `PENDING` → crm_contacts (existente)
2. **Importa crm_contacts órfãos → customers** (novo)
3. Ambas as tabelas ficam vinculadas via `customer_id` / `crm_contact_id`


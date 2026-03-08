

## Plano: Adicionar importação de Clientes via CSV

A página `CsvImportPage.tsx` atualmente suporta apenas **Lojas** e **Ofertas**. O plano é estender para suportar também **Clientes** e **Contatos CRM**.

### O que será feito

Adicionar o tipo `CUSTOMERS` ao importador CSV existente, incluindo:

1. **Nova opção "Clientes" no select de tipo** -- valor `CUSTOMERS`
2. **Colunas esperadas**: `name` (obrigatório), `phone`, `cpf`, `email`, `points_balance`, `money_balance`, `is_active`
3. **Validação**: nome obrigatório, phone/cpf formato livre, `points_balance`/`money_balance` numéricos
4. **Lógica de importação**: inserir na tabela `customers` com `brand_id` e `branch_id` selecionados
5. **Sincronização CRM**: opcionalmente criar um `crm_contact` para cada cliente importado (checkbox "Criar contato CRM automaticamente", com `source = 'STORE_UPLOAD'`)
6. **Template CSV de exemplo**: adicionar botão de download do template para clientes

### Alterações em arquivo

**`src/pages/CsvImportPage.tsx`** (arquivo único):

- Adicionar constantes `CUSTOMER_REQUIRED = ["name"]` e `CUSTOMER_COLUMNS = ["name", "phone", "cpf", "email", "points_balance", "money_balance", "is_active"]`
- Adicionar função `validateCustomerRow`
- Expandir `ImportType` para incluir `"CUSTOMERS"`
- No select de tipo, adicionar `<SelectItem value="CUSTOMERS">Clientes</SelectItem>`
- No `importMutation`, adicionar branch `else if (importType === "CUSTOMERS")` que:
  - Insere em `customers` (name, phone, cpf, brand_id, branch_id, points_balance, money_balance, is_active)
  - Se checkbox `autoCreateCrmContacts` ativo, insere em `crm_contacts` (brand_id, branch_id, customer_id, name, phone, email, cpf, source='STORE_UPLOAD')
- Adicionar checkbox "Criar contatos CRM" (visível quando tipo = CUSTOMERS)
- Invalidar queries `["customers"]` e `["crm-contacts"]` ao final
- Atualizar `expectedColumns` para considerar o novo tipo
- Adicionar botão "Baixar template" que gera CSV de exemplo com as colunas corretas

### Sem alterações de banco

As tabelas `customers` e `crm_contacts` já existem com RLS adequada. Nenhuma migration necessária.




## Plano: Unificar fluxo de Nova Organização com Provisionamento

### Problema atual
- `/tenants/new` (TenantForm) cria apenas o Tenant (nome, slug, plano, status) — sem marca, cidade ou contas de teste.
- `/provision-brand` (ProvisionBrandWizard) cria Tenant + Brand + Branch + contas de teste automaticamente.
- São dois caminhos desconectados para o mesmo objetivo.

### Solução

Modificar o `TenantForm.tsx` para que, após salvar o Tenant com sucesso (modo criação), exiba uma **opção de continuar para o wizard de provisionamento** da marca, pré-preenchendo os dados já informados.

#### Alterações

**1. `src/pages/TenantForm.tsx`**
- Após criar o Tenant com sucesso, em vez de redirecionar direto para `/tenants`, exibir um card de confirmação com dois botões:
  - "Voltar para Organizações" → navega para `/tenants`
  - "Provisionar Marca Completa" → navega para `/provision-brand?tenant_name={name}&tenant_slug={slug}` passando os dados via query params
- No modo edição, o comportamento permanece igual (redireciona para `/tenants` após salvar).

**2. `src/pages/ProvisionBrandWizard.tsx`**
- Ler query params `tenant_name` e `tenant_slug` na inicialização.
- Se presentes, pré-preencher `company_name` e `brand_slug` com esses valores e iniciar no step "company" com os campos já preenchidos.

### Detalhes técnicos

- Usar `useSearchParams` do react-router-dom para ler os query params no wizard.
- No TenantForm, usar um state `created` para controlar a exibição do card pós-criação ao invés do redirect imediato.
- Nenhuma alteração de banco de dados necessária — a Edge Function `provision-brand` já reutiliza Tenant existente por slug.


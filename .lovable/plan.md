

## Plano: Melhorar Clonagem de Branch — Adicionar Regras de Pontos e Produtos

### Situação Atual

- A página `CloneBranchPage.tsx` clona **Lojas** e **Ofertas** entre branches.
- A tabela `points_rules` existe e tem colunas `brand_id` e `branch_id` (nullable).
- **Não existe** tabela `store_products` no banco de dados. Portanto, a clonagem de produtos não é possível no momento.

### O que será feito

**1. Adicionar opção "Clonar Regras de Pontos"** no `CloneBranchPage.tsx`:
- Novo checkbox na seção "O que clonar?" com label "Clonar Regras de Pontos" e descrição explicativa.
- Lógica de clonagem: ler `points_rules` do `branch_id` de origem, inserir no destino com o novo `branch_id`, pulando regras com `rule_type` já existente no destino.
- Campos copiados: `rule_type`, `points_per_real`, `money_per_point`, `min_purchase_to_earn`, `max_points_per_purchase`, `max_points_per_customer_per_day`, `max_points_per_store_per_day`, `require_receipt_code`, `is_active`, `allow_store_custom_rule`, limites de store custom rule.

**2. Atualizar interface e tipos**:
- Adicionar `pointsRules: boolean` ao `CloneOptions`.
- Atualizar `canClone` para incluir `pointsRules` como opção válida.
- Registrar no `audit_log` o campo `clone_points_rules`.

**3. Sobre Produtos (`store_products`)**:
- A tabela não existe. Informarei ao usuário que esta funcionalidade requer primeiro a criação da tabela de produtos. A clonagem poderá ser adicionada depois.

### Detalhes Técnicos

Arquivo modificado: `src/pages/CloneBranchPage.tsx`

A lógica de clonagem de `points_rules` seguirá o mesmo padrão das lojas:
1. Buscar regras da origem filtrando por `branch_id` e `brand_id`
2. Verificar duplicatas no destino por `rule_type`
3. Inserir as novas regras com o `branch_id` do destino
4. Logar resultado (criadas / ignoradas)

Nenhuma migração de banco é necessária.


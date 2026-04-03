

# Modelo de Negócio por Cidade — Seletor na Regras de Resgate

## Objetivo
Adicionar um seletor de cidade no card "Modelo de Negócio Padrão" da página Regras de Resgate, permitindo ao empreendedor escolher uma cidade específica e alterar seu `scoring_model` diretamente, sem precisar ir até o formulário de edição da cidade.

## Situação Atual
- O card atual só salva um valor padrão da marca (`brand_settings_json.default_scoring_model`)
- Para alterar o modelo de uma cidade existente, o empreendedor precisa ir em Cidades > Editar
- O `scoring_model` de cada cidade é armazenado na coluna `branches.scoring_model`

## Plano

### 1. Buscar cidades da marca
Adicionar uma query para listar as branches da marca (`id`, `name`, `scoring_model`), exibindo-as num Select/Combobox dentro do card.

### 2. Redesenhar o card "Modelo de Negócio"
- Adicionar um `Select` no topo do card para escolher entre "Padrão da Marca (novas cidades)" e cada cidade existente
- Quando "Padrão da Marca" estiver selecionado: salva em `brand_settings_json.default_scoring_model` (comportamento atual)
- Quando uma cidade específica estiver selecionada: o RadioGroup mostra o `scoring_model` atual daquela cidade e salva diretamente na tabela `branches`

### 3. Salvar por cidade
Ao selecionar uma cidade e alterar o modelo, o save faz `update` em `branches` com o novo `scoring_model` para aquele `branch_id`.

### Arquivos alterados
- `src/pages/RegrasResgatePage.tsx` — adicionar query de branches, Select de cidade, lógica condicional de leitura/salvamento

### Detalhes técnicos
- Query adicional: `branches` filtrada por `brand_id`, campos `id, name, scoring_model`
- Estado: `selectedBranchId` (null = padrão da marca)
- Ao trocar de cidade no Select, o RadioGroup reflete o `scoring_model` daquela branch
- Save condicional: se `selectedBranchId` é null, salva no brand JSON; caso contrário, faz update na branch
- Invalidar queries de branches após salvar para manter consistência


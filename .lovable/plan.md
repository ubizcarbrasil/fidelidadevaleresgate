

## Diagnóstico

O problema é simples: a brand ativa no banco ("Brand Premium", id `55418252...`) **não tem nenhuma branch/filial cadastrada**. As branches existentes (São Paulo e Rio de Janeiro) pertencem a outra brand (`2750cec8...`).

O preview carrega a brand corretamente, mas como `branches = []`, o `BranchPickerSheet` não tem nada para mostrar e o `selectedBranch` fica `null`. A página renderiza, mas sem dados de cidade/localização.

## Plano

1. **Verificar/corrigir os dados no banco**: As branches precisam estar associadas à brand ativa. Há duas opções:
   - Criar branches para a brand "Brand Premium"
   - Ou alterar o `CustomerPreviewPage` para buscar a brand que realmente tem branches (a `2750cec8...`)

2. **Tornar o layout resiliente a branches vazias**: Atualmente, se não há branches, o `BranchPickerSheet` renderiza mas sem opções. Devemos esconder o botão de localização quando `branches.length === 0`.

### Mudanças no código

**`BranchPickerSheet.tsx`**: Retornar `null` se `branches.length === 0` para não mostrar o seletor vazio.

**`CustomerPreviewPage.tsx`**: Alterar a query para buscar uma brand que tenha pelo menos uma branch ativa, garantindo que o preview sempre funcione com dados reais.

### Detalhes técnicos

- No `CustomerPreviewPage`, a query atual busca qualquer brand ativa. Vamos ajustá-la para buscar uma brand que tenha branches, usando um join ou subquery.
- No `BranchPickerSheet`, adicionar um early return `if (branches.length === 0) return null`.


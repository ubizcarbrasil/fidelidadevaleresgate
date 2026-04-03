

# Modelo de Negócio Padrão - Correção de Acesso

## Problema Identificado

O campo "Modelo de Negócio Padrão" foi adicionado dentro da página **Aparência da Marca** (`/brands`), que fica no grupo **Personalização & Vitrine** e depende do módulo `brand_theme` estar ativo. Isso causa dois problemas:

1. Se o módulo `brand_theme` não estiver habilitado, o item de menu nem aparece no sidebar
2. Mesmo com o módulo ativo, a configuração de modelo de negócio não tem relação semântica com "Tema Visual" - fica escondido num lugar inesperado

## Solução

Mover o campo "Modelo de Negócio Padrão" para a página **Regras de Resgate** (`/regras-resgate`), que já está sempre visível no sidebar do empreendedor (grupo "Resgate com Pontos") e é o local mais intuitivo para configurar o modelo de pontuação da marca.

### Alterações

1. **`src/pages/RegrasResgatePage.tsx`** - Adicionar uma seção/card "Modelo de Negócio Padrão" com RadioGroup (DRIVER_ONLY, PASSENGER_ONLY, BOTH), lendo e salvando em `brand_settings_json.default_scoring_model`

2. **`src/pages/BrandForm.tsx`** - Remover o card "Modelo de Negócio Padrão" da aba "Tema Visual" para evitar duplicidade

3. **`src/pages/BrandBranchForm.tsx`** - Sem alteração (já lê o `default_scoring_model` corretamente)

### Benefícios
- Sempre acessível sem depender de módulos opcionais
- Localizado junto às outras regras de pontuação/resgate
- Visível diretamente no menu lateral para qualquer empreendedor


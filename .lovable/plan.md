

# Plano: Adicionar campo de WhatsApp no editor da marca

## Problema
O botão de WhatsApp nos Achadinhos lê `brand_settings_json.whatsapp_number`, mas não existe nenhum campo no painel para cadastrar esse número.

## Solução
Adicionar um campo "WhatsApp dos Achadinhos" no `BrandThemeEditor.tsx`, na seção de imagens/identidade (onde já ficam logo e favicon), para que o admin da marca configure o número.

## Alterações

### 1. `src/components/BrandThemeEditor.tsx`
- Adicionar um campo `Input` com label "WhatsApp (Achadinhos)" e placeholder "5511999999999"
- O campo lê/grava em `value.whatsapp_number` / `update({ whatsapp_number: ... })`
- Posicionar na seção de identidade visual, próximo ao logo
- Incluir ícone `MessageCircle` no label para clareza

### 2. `src/hooks/useBrandTheme.ts` (se necessário)
- Verificar se o tipo `BrandTheme` aceita campos extras ou se precisa adicionar `whatsapp_number?: string`

Após salvar, o número ficará disponível automaticamente no `brand_settings_json` e o botão nos Achadinhos funcionará.


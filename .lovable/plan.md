

## Plano: Remover indicador de localização duplicado da Home

### Problema
A linha "Visualizando ofertas em: São João da Boa Vista" aparece abaixo da saudação, mas a localização já é exibida no header (pill com ícone de pin). É informação duplicada.

### Alteração

**`src/pages/customer/CustomerHomePage.tsx`** (linhas 198-220)
- Remover o bloco inteiro do `{/* Location line */}` — o `<button>` com `handleRedetect`, o `<MapPin>`, e o texto "Visualizando ofertas em:".

**`src/components/BrandThemePreview.tsx`** (linhas 255-258)
- Remover a linha equivalente no preview do celular para manter consistência.


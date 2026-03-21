

## Plano: Adicionar campo de banner de produto no admin

### Problema

O `AchadinhoDealDetail` lê `brandSettings.achadinho_detail_banner_url` para exibir o banner atrás da foto do produto, mas não existe campo no painel admin para fazer upload dessa imagem.

### Implementação

**`src/pages/AffiliateCategoriesPage.tsx`**

Na seção de configuração do CTA (que já existe), adicionar logo acima:

1. Campo de upload de imagem usando `StorageImageUpload` com label "Banner da página de produto"
2. Proporção sugerida: 16:9
3. O valor salva em `brand_settings_json.achadinho_detail_banner_url`
4. Incluir `ImageAiActions` para as 3 opções de IA (redesenhar, ajustar, melhorar)
5. Ao salvar, persiste junto com o CTA no mesmo `brand_settings_json`

### Arquivo
- `src/pages/AffiliateCategoriesPage.tsx` — adicionar campo de upload do banner na seção de configurações


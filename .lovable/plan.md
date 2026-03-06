

## Ícones de Categorias/Segmentos Configuráveis via Galeria

### Situação atual
O componente `SegmentNavSection` renderiza ícones dos segmentos usando o campo `icon_name` da taxonomia (tabela). Esses ícones são Lucide hardcoded — não passam pelo sistema de galeria/AppIcons configurável pelo painel admin.

### O que falta
Permitir que o admin, ao editar a taxonomia ou os segmentos, escolha ícones da **galeria de ícones** (incluindo ícones customizados com URL) em vez de apenas nomes Lucide fixos.

### Plano

1. **Atualizar a página de Taxonomia** (`TaxonomyPage.tsx`) para incluir o `IconPickerDialog` ao definir o ícone de cada categoria/segmento, permitindo escolher da galeria de ícones da marca.

2. **Atualizar `SegmentNavSection`** para suportar ícones customizados (URL) além de nomes Lucide — reutilizando o componente `AppIcon` já existente, ou renderizando `<img>` quando o valor do ícone for uma URL.

3. **Nenhuma migração de banco necessária** — o campo `icon_name` na taxonomia já é texto livre, basta armazenar a referência (nome Lucide ou URL da galeria).

### Escopo
- ~3 arquivos editados: `TaxonomyPage.tsx`, `SegmentNavSection.tsx`, possivelmente `SegmentIcon` inline
- Sem alterações no banco de dados




## Plano: Criar Template + Preview Visual no App

### O Que Será Feito

**1. Formulário de criação/edição de template** (Dialog ou full-page dentro de `HomeTemplatesPage.tsx`)
- Campos: `name`, `key`, `description`, ícone (select entre emojis disponíveis)
- Toggle `is_default`
- Editor de seções dinâmico:
  - Botão "Adicionar Seção" que permite escolher o `template_type` (dropdown dos 11 tipos existentes em `section_templates`)
  - Cada seção editável: `title`, `subtitle`, `cta_text`, `visual_json` (editor JSON simples), fontes de dados (`source_type`, `filters_json`, `limit`)
  - Reordenação por drag ou botões up/down
  - Remover seção
- Botão "Salvar" que faz `INSERT` ou `UPDATE` no `home_template_library`
- Botão "Editar" nos cards existentes (além de Preview e Aplicar)

**2. Preview visual estilo app do cliente** (Dialog grande ou panel lateral)
- Ao clicar "Preview", ao invés de exibir a lista técnica atual (JSON/badges), renderizar um **mockup mobile** com moldura de smartphone
- Dentro da moldura, renderizar cada seção do `template_payload_json` com os mesmos componentes visuais do `HomeSectionsRenderer` (cabeçalhos, placeholders de cards, banners)
- Como o template não tem dados reais, usar **placeholders visuais** (skeletons estilizados ou cards fictícios com ícones e textos genéricos) que representem cada tipo de seção:
  - `BANNER_CAROUSEL` → retângulo com gradiente e ícone de imagem
  - `OFFERS_CAROUSEL` → row de cards genéricos com título e preço fictício
  - `OFFERS_GRID` → grid 2-col com cards placeholder
  - `STORES_GRID` / `STORES_LIST` → avatares com nome placeholder
  - `VOUCHERS_CARDS` → ticket rosa estilo cupom
  - `MANUAL_LINKS_*` → ícones em grid/carrossel
- Header do mockup: barra de status + greeting "Bom dia, Cliente!" + hero card de saldo

### Arquivos

| Arquivo | Ação |
|---|---|
| `src/pages/HomeTemplatesPage.tsx` | Adicionar estado e dialogs para criar/editar template + preview visual mobile |
| `src/components/HomeTemplateEditor.tsx` | **Novo** — formulário reutilizável para criação e edição de templates |
| `src/components/HomeTemplateMobilePreview.tsx` | **Novo** — mockup mobile que renderiza placeholders visuais por tipo de seção |

### Detalhes Técnicos

- O editor constrói o `template_payload_json` interativamente, mantendo o mesmo formato JSON que já existe na tabela
- O preview mobile é um `div` com `max-w-[375px]`, `aspect-ratio: 9/19.5`, `border-radius`, `border` e `overflow-y: auto` para simular um smartphone
- Os 11 tipos de `section_templates` serão mapeados para componentes placeholder dentro do preview
- O insert/update usa `supabase.from("home_template_library").upsert(...)` com o `key` como identificador
- Nenhuma migration necessária — a tabela `home_template_library` já tem todas as colunas




## Plano: Preview ao vivo lado a lado no Editor

### O Que Será Feito

Quando o dialog do editor abrir (criar ou editar), o layout será dividido em **duas colunas**:
- **Esquerda**: formulário do `HomeTemplateEditor` (como está hoje)
- **Direita**: `HomeTemplateMobilePreview` renderizando em tempo real as seções que estão sendo editadas

A cada mudança no editor (adicionar/remover/reordenar seções, editar títulos), o preview atualiza automaticamente.

### Alterações

| Arquivo | Mudança |
|---|---|
| `src/components/HomeTemplateEditor.tsx` | Recebe prop opcional `renderPreview` (render prop) que recebe as seções atuais e exibe o preview. Alternativa: expor as seções via callback `onSectionsChange` para o pai renderizar o preview ao lado. |
| `src/pages/HomeTemplatesPage.tsx` | Aumentar o dialog do editor para `max-w-6xl`. Dividir o conteúdo em grid 2 colunas: editor à esquerda, `HomeTemplateMobilePreview` à direita com as seções em tempo real. |

### Detalhes Técnicos

- O `HomeTemplateEditor` ganhará uma prop `onSectionsChange?: (sections: TemplateSection[]) => void` chamada a cada `setSections`.
- No `HomeTemplatesPage`, um estado local `liveSections` será atualizado pelo callback e passado ao `HomeTemplateMobilePreview`.
- O dialog do editor usará `max-w-6xl` com layout `grid grid-cols-1 lg:grid-cols-[1fr_auto]` — o preview fica sticky à direita.
- Em telas menores, o preview ficará oculto (hidden em mobile) para não quebrar o layout.


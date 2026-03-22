

## Plano: Ajustes finais de mobile na página Taxonomia

### Problemas restantes no mobile (430px)

1. **Título "Taxonomia de Segmentos"** — `text-2xl` é grande demais para 430px, e a descrição longa pode ocupar muito espaço
2. **Badges no card de segmento** — quando o segmento tem badge de categoria + badge de ícone na mesma linha, transborda horizontalmente
3. **Logs de Matching** — cada log tem 2 badges lado a lado + texto, que estouram em tela pequena
4. **Chips de categoria mobile** — não tem opção de editar/excluir categoria no mobile (só aparece no desktop com hover)
5. **Diálogos** — `max-w-lg` no dialog de segmento pode ficar colado nas bordas

### Correções — `src/pages/TaxonomyPage.tsx`

1. **PageHeader**: Trocar para `text-xl sm:text-2xl` no título (via PageHeader ou wrapper local)
2. **Badges de segmento**: Em mobile, empilhar badges abaixo do nome em vez de inline — usar `flex-wrap` e esconder badge de icon_name no mobile
3. **Logs**: Em mobile, empilhar texto e badges verticalmente (`flex-col sm:flex-row`)
4. **Chips de categoria mobile**: adicionar long-press ou botão de edição inline nos chips; ou adicionar botão "Gerenciar categorias" que abre o dialog
5. **Dialog de segmento**: usar `max-w-lg w-[calc(100vw-2rem)]` para não colar nas bordas

### Arquivo
- `src/pages/TaxonomyPage.tsx`


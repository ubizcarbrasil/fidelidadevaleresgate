

## Plano: Corrigir usabilidade do Construtor de Páginas em mobile

### Problemas identificados

1. **Layout desktop sendo renderizado no mobile (430px)**: O hook `useIsMobile` começa como `undefined` (falsy), fazendo o layout de 3 painéis (ResizablePanelGroup) renderizar inicialmente em vez do layout mobile com tabs. Num viewport de 430px com sidebar aberta, o conteúdo fica ilegível (~190px para 3 painéis).

2. **INP extremamente alto (536ms–2336ms)**: Interações demoram muito para responder visualmente, dando a impressão de que o sistema não funciona.

### Alterações

**1. `src/hooks/use-mobile.tsx`**
- Inicializar `isMobile` com valor computado imediatamente (SSR-safe) em vez de `undefined`
- Usar `typeof window !== "undefined" ? window.innerWidth < 768 : false` como valor inicial
- Isso garante que o layout mobile renderize desde o primeiro frame

**2. `src/components/page-builder/UnifiedEditor.tsx`**
- Fechar a sidebar automaticamente ao montar o editor em mobile, usando o `SidebarContext` ou um evento
- Adicionar `React.memo` nos sub-componentes pesados (LivePreview, block list items) para reduzir re-renders desnecessários
- Envolver a lista de blocos em `useDeferredValue` para manter a interface responsiva durante atualizações

### Detalhes técnicos

A causa raiz do "sessões não carregam" é visual, não funcional:
- RLS está correto (policies de ALL + SELECT permitem acesso)
- Dados existem no banco (3 sessões Home, 3 sessões "Resgate na cidade")
- A query `brand_sections` com join em `section_templates` e `brand_section_sources` retorna dados corretamente

A correção principal é garantir que `useIsMobile()` retorne `true` desde o primeiro render em viewports estreitos, evitando o flash do layout desktop.


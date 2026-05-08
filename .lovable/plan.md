## Problema

Ao clicar em **"Todos"** na grade de categorias (após já ter selecionado uma categoria), a página realmente troca para a visão geral (Destaques, Novas, Seções por categoria, Todas as ofertas), mas **não há rolagem visual**. Como o usuário está no meio da página (na seção da categoria filtrada), parece que "nada abriu" — o conteúdo de cima fica fora da tela.

Hoje em `pagina_ubiz_ofertas.tsx` o `useEffect` de rolagem só age quando há categoria selecionada:

```ts
useEffect(() => {
  if (!categoriaSelecionadaId) return; // ← ignora "Todos"
  ...scrollIntoView(cabecalhoCategoriaRef)
}, [categoriaSelecionadaId]);
```

## Solução

Quando `categoriaSelecionadaId` voltar a `null` (clique em "Todos" ou em "Mostrar todas"), rolar suavemente para o topo da vitrine (logo abaixo do cabeçalho/banner — na grade de categorias), para que o usuário veja imediatamente as seções de Destaques / Novas / etc.

### Mudanças

Arquivo: `src/features/ubiz_ofertas/pagina_ubiz_ofertas.tsx`

1. Adicionar um `useRef` adicional `gradeCategoriasRef` e prendê-lo no wrapper do `<GradeCategoriasOfertas />` (com `scroll-mt-4`).
2. Atualizar o `useEffect` de rolagem para tratar os dois casos:
   - Se `categoriaSelecionadaId` definido → rola para `cabecalhoCategoriaRef` (comportamento atual).
   - Se `null` → rola suavemente para `gradeCategoriasRef` (mostra Categorias + seções abaixo).
3. Garantir que o efeito só dispare em mudança real (e não no primeiro mount sem filtro), usando uma flag `useRef(false)` que marca após a primeira interação, evitando rolagem indesejada ao abrir a página.

Sem mudanças em outros arquivos. Sem alteração de URL/lógica de filtro — apenas UX de rolagem.



# Forçar rebuild do servidor de preview

## Problema
A preview está travada na fase `ENTRY_LOADING`, indicando que o dev server não está servindo o entrypoint corretamente.

## Correção
Adicionar um comentário com timestamp no `src/main.tsx` para forçar o Vite a invalidar o módulo e rebuildar.

### `src/main.tsx`
- Adicionar comentário `// rebuild 2026-03-29` no topo do arquivo (após os imports existentes), sem alterar nenhuma lógica.


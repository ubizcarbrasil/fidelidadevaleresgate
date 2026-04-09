

# Tornar botão de Reset de Pontos mais visível no mobile

## Problema
O botão de resetar pontos é um ícone pequeno (`RotateCcw` 14px) sem label, difícil de identificar no mobile (430px).

## Solução
Reorganizar as ações de cada card de cidade em duas linhas no mobile:
- **Linha 1**: Nome da cidade + Switch ativo/inativo
- **Linha 2**: Dois botões com label textual — "Resetar pontos" e "Editar" — usando `variant="outline"` e `size="sm"`, visíveis e clicáveis

No desktop, os botões podem manter o layout inline com labels visíveis.

## Mudanças

### `src/pages/BrandBranchesPage.tsx`

Substituir os dois `Button size="icon"` (reset e editar) por botões com ícone + texto, movidos para uma linha separada abaixo do nome/switch:

```tsx
{/* Linha de ações — abaixo dos badges */}
<div className="flex items-center gap-2 pl-12">
  <Button
    variant="outline"
    size="sm"
    className="h-8 text-xs gap-1.5"
    onClick={() => setResetBranch({ id: branch.id, name: branch.city || branch.name })}
  >
    <RotateCcw className="h-3.5 w-3.5" />
    Resetar pontos
  </Button>
  <Button
    variant="outline"
    size="sm"
    className="h-8 text-xs gap-1.5"
    onClick={() => navigate(`/brand-branches/${branch.id}`)}
  >
    <Pencil className="h-3.5 w-3.5" />
    Editar
  </Button>
</div>
```

A primeira linha do card fica apenas com nome + switch, mais limpa e legível.


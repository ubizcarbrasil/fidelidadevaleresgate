

# Atualizar nomes no hook useMenuLabels

## Problema
O `useMenuLabels.ts` possui um mapa `DEFAULT_LABELS` que é consultado pelo sidebar via `getLabel(key)`. Esse mapa não foi atualizado com os novos nomes, então os labels antigos continuam aparecendo.

## Alteração em `src/hooks/useMenuLabels.ts`

Adicionar/atualizar estas entradas no objeto `DEFAULT_LABELS.admin`:

| Key | Valor atual | Novo valor |
|-----|------------|------------|
| `sidebar.espelhamento` | *(não existe)* | `"Espelhamento Achadinho"` |
| `sidebar.governanca_ofertas` | *(não existe)* | `"Governança Achadinho"` |
| `sidebar.motoristas` | *(não existe)* | `"Motorista"` |
| `sidebar.driver_points_rules` | *(não existe)* | `"Regras de Pontuação Motorista"` |

Arquivo único afetado: `src/hooks/useMenuLabels.ts`


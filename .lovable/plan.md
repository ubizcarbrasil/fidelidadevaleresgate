

## Plano: Corrigir label "sidebar.patrocinados"

### Problema
O hook `useMenuLabels` não possui a chave `"sidebar.patrocinados"` no mapa `DEFAULT_LABELS.admin`, então exibe o key bruto no menu.

### Solução
Adicionar a entrada `"sidebar.patrocinados": "Patrocinados"` ao objeto `DEFAULT_LABELS.admin` em `src/hooks/useMenuLabels.ts`, junto das demais chaves da seção de Gestão Comercial.

### Arquivo alterado
1. `src/hooks/useMenuLabels.ts` — adicionar uma linha no bloco `admin`


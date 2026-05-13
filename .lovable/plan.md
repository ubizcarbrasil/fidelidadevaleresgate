## Problema
Os 3 sub-overlays do Campeonato do motorista (Tabela completa, Chaveamento, Histórico Completo) são abertos em `Sheet` mas o cabeçalho **não tem botão de voltar** — só o gesto de swipe/clique fora fecha. No mobile isso confunde (vide screenshot do "Histórico Completo").

## Plano
Editar `src/components/driver/campeonato/CampeonatoMotoristaPanel.tsx`:

- Adicionar um botão `ArrowLeft` (mesmo padrão do header principal: `h-9 w-9 rounded-lg`, `aria-label="Voltar"`) à esquerda do título em cada um dos três cabeçalhos sticky:
  1. Tabela · {tier_name}
  2. Chaveamento · {tier_name}
  3. Histórico Completo
- Cada botão chama `setOverlay(null)` para fechar o sheet.
- Manter layout flex (`flex items-center gap-3`) para alinhar ícone + título.

## Arquivos afetados
- `src/components/driver/campeonato/CampeonatoMotoristaPanel.tsx`
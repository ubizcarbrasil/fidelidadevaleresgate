## Objetivo
Adicionar uma terceira forma de definir quem entra na temporada: **linha de corte por atividade** (período + quantidade mínima de corridas), mantendo os modos manual e automático já existentes.

## Comportamento esperado

Na tela de criação de temporada (tanto no modo automático quanto no avançado), o empreendedor passa a escolher entre 3 modos de elegibilidade:

1. **Automático (ranking)** — comportamento atual: pega os Top N do ranking de pontos do período.
2. **Manual** — comportamento atual: empreendedor escolhe motorista por motorista e edita séries.
3. **Linha de corte (novo)** — define dois parâmetros:
   - Período de atividade (ex.: últimos 7, 15, 30, 60, 90 dias — com opção "personalizado")
   - Mínimo de corridas no período (ex.: pelo menos X corridas)
   
   O sistema lista automaticamente todos os motoristas da cidade que cumprem o critério, mostra contagem em tempo real e distribui nas séries do template seguindo a ordem do ranking de pontos. O empreendedor ainda pode abrir o editor manual depois para ajustes finos (mantendo a edição manual já implementada).

## Tela e UX

- Adicionar um seletor de **Modo de seleção** no topo do passo "Motoristas e séries" (3 abas/segmentos: Ranking · Linha de corte · Manual).
- Quando "Linha de corte" estiver ativo:
  - Dois campos: `Período (dias)` e `Mínimo de corridas`.
  - Badge em tempo real: "X motoristas elegíveis" + alerta se o número for menor que a soma das séries do template.
  - Lista filtrada já reflete o critério; checkboxes ficam desabilitados (somente leitura) até o usuário clicar em "Permitir edição manual" (que cai no modo Manual preservando a seleção).
- Painel resumo continua mostrando data final, séries preenchidas e impacto.
- Tudo mobile/PWA, mantendo o padrão das telas atuais.

## Alterações técnicas (resumo)

- **`PassoMotoristasESeries.tsx`**: novo estado `modoSelecao: 'ranking' | 'corte' | 'manual'` + bloco de configuração da linha de corte (período + mínimo de corridas).
- **Novo componente** `src/products/campeonato/components/empreendedor/criar_temporada/ConfiguracaoLinhaCorte.tsx`: inputs do período e mínimo de corridas, com presets rápidos (7/15/30/60/90 dias).
- **Novo hook** `src/products/campeonato/hooks/hook_motoristas_elegiveis_corte.ts`: usa o RPC já existente `get_drivers_ranking_for_season` (já recebe `p_since_days`) e filtra client-side por `rides_count >= minimo`. Não exige migração de banco.
- **`TabelaMotoristasRanqueados.tsx`**: aceitar `prop` `somenteLeitura` para desabilitar checkboxes no modo "corte".
- Auto-distribuição nas séries reaproveita a função já usada no modo automático (Top N por série, em ordem).
- Botão "Permitir edição manual" copia a seleção atual para o modo manual.

## Fora de escopo

- Nenhuma mudança de schema/RLS — o RPC atual já entrega `rides_count` e `points_balance` por período.
- Não altera o fluxo de seeding nem a edge function `admin-brand-actions`.
- Não mexe em modos de pontuação, prêmios ou datas.

Posso seguir com a implementação?


# Plano definitivo — Campeonato

Dois problemas, duas correções. Sem mais loops.

---

## Parte 1 — Temporada Maio/2026 (destrava de vez)

**Estado real do banco agora:** Não há mais nenhuma temporada Maio/2026 ativa na sua cidade (`aa1e7a2c…`). Todas as 6 estão canceladas. A única "ativa" é em outra cidade (`ece001ed…`). O bloqueio do modal era cache obsoleto do React Query.

**Correções:**
1. `useCancelarTemporada` (hook_mutations_campeonato): após sucesso, invalidar **na hora** as queries `check-season-conflict` e `check-season-overlap` para o `brandId`/`branchId` envolvidos. Hoje só invalida a lista de temporadas — por isso o aviso vermelho continuava aparecendo após cancelar.
2. `FormCriarTemporadaAutomatico` e `FormCriarTemporadaAvancado`: na mensagem do conflito, mostrar **ID curto + data de criação** da temporada conflitante (para você saber qual é).
3. `useCriarTemporadaCompleta`: detectar também o índice atual `campeonato_seasons_active_brand_branch_year_month_key` no parsing de erro de duplicidade (hoje só reconhece o nome legado).
4. Validação final: abrir o modal de criação Maio/2026 → confirmar zero aviso vermelho → criar com sucesso.

---

## Parte 2 — App do motorista: visual de transmissão de futebol

**Problema:** a estrutura existe (drawer, abas, cards de duelo, classificação, chaveamento), mas o **acabamento visual** ainda parece um app genérico de admin — não a transmissão da Globo/SporTV que você mostrou nas referências. O tema verde existe em CSS mas os componentes não exploram nem metade do que a referência exige.

**Reconstrução completa da camada visual (sem mexer em hook/RPC/banco):**

### A — Header de transmissão
- Substituir o header atual por um **placar de transmissão**: logo do campeonato à esquerda, nome em fonte display condensada (estilo Bebas Neue), badge da fase pulsante, linha de status com fase + dias restantes em tabular-nums grandes.
- Faixa horizontal de séries (chips A/B/C/D) com a do motorista destacada em neon lime e underline animado — substitui o seletor "Trocar série" tímido de hoje.
- Banner foto-obrigatória vira **banner full-bleed vermelho** com ícone de câmera grande, não amarelinho discreto.

### B — Card de duelo no estilo "scorebug" da TV
Refazer `card_duelo_futebol.tsx`:
- Avatares **80px** (hoje 40px), borda dupla + halo neon quando AO VIVO.
- Placar central tipográfico **48-64px** em fonte condensada, com separador `×` cromado.
- Faixa superior preta com hora + cidade (estilo SporTV).
- Faixa inferior com barra de progresso do tempo (24h) preenchendo da esquerda em neon, e texto "AO VIVO" piscante alinhado ao padrão de transmissão.
- Faixa de "última corrida há Xmin" abaixo do placar, atualizando em tempo real.
- Estado vencedor: lado vencedor ganha **moldura dourada + coroa**; perdedor desbota em escala de cinza.

### C — Tabela de classificação Brasileirão
Refazer `AbaClassificacao.tsx`:
- Colunas alinhadas como tabela do Brasileirão: `# | Time | P | DR | V | E | D | SG`.
- Linhas com **foto circular 32px** + nome do motorista.
- Zona de classificação ao mata-mata: faixa lateral verde nas N primeiras linhas.
- Zona de rebaixamento: faixa lateral **vermelha** nas últimas linhas (já existe mas precisa ser visualmente óbvia).
- Linha do motorista logado: fundo neon-lime suave + sticky no topo quando rolar.
- Header sticky com mesma estrutura.

### D — Chaveamento mata-mata espelhado
Refazer `AbaChaveamento.tsx`:
- Layout **espelhado**: chave esquerda (oitavas → quartas → semi) | troféu central | chave direita (semi → quartas → oitavas).
- Conectores SVG curvos entre rodadas (não quadrados).
- Cada slot vira mini scorecard com 2 fotos circulares + placar.
- Troféu central anima (pulse + brilho) quando há campeão.
- Em mobile (430px): vira accordion vertical por rodada com indicador "← Você está aqui".

### E — Drawer estilo app de futebol
- Fundo verde escuro com pattern sutil de gramado (CSS gradient, sem imagem).
- Item ativo: barra lateral neon de 4px + texto em bold + ícone preenchido.
- Header do drawer: foto do motorista 64px, nome, série em badge, "Você está na X posição" em destaque.
- Botão "Trocar foto" direto no drawer (não só no banner).

### F — Tokens visuais novos em `index.css`
Adicionar dentro de `.tema-campeonato`:
- `--scorebug-bg`, `--scorebug-border` (preto + neon)
- `--gold` (HSL) para vencedores e troféu
- `--relegation-red` para zona vermelha
- Fonte: importar **Bebas Neue** + **Barlow Condensed** via Google Fonts (já temos provisão em `fontPair`) e aplicar via `--font-display-campeonato` apenas dentro de `.tema-campeonato`.
- Animação `@keyframes neon-pulse` para AO VIVO e troféu.

### G — Limpeza
- Remover `BannerFotoObrigatoria` amarelo atual e substituir pelo full-bleed vermelho.
- Remover placeholder "Em construção" residual de qualquer aba (validar todas).
- Corrigir warning do console: `ListaTemporadasAnteriores.tsx:182` — falta `key` em uma `<li>` (rápido, mas visível como bug).

---

## Arquivos afetados

**Parte 1 (4 arquivos):**
- `src/products/campeonato/hooks/hook_mutations_campeonato.ts`
- `src/products/campeonato/components/empreendedor/FormCriarTemporadaAutomatico.tsx`
- `src/products/campeonato/components/empreendedor/FormCriarTemporadaAvancado.tsx`
- `src/products/campeonato/components/empreendedor/ListaTemporadasAnteriores.tsx` (key fix)

**Parte 2 (8 arquivos):**
- `src/index.css` (tokens + fontes + keyframes)
- `src/products/campeonato/pages/pagina_campeonato_motorista.tsx` (header + banner)
- `src/products/campeonato/components/motorista/card_duelo_futebol.tsx`
- `src/products/campeonato/components/motorista/AbaClassificacao.tsx`
- `src/products/campeonato/components/motorista/AbaChaveamento.tsx`
- `src/products/campeonato/components/motorista/BracketCompleto.tsx`
- Novo: `src/products/campeonato/components/motorista/header_transmissao.tsx`
- Novo: `src/products/campeonato/components/motorista/chips_series.tsx`

**Fora do escopo desta etapa:** Etapas C/D/E (próximos campeonatos, notificações chat, painel admin de programação) — já existem e ficam para depois.

---

## Validação

1. Cancelar uma temporada teste → aviso vermelho some na hora, sem F5.
2. Criar Maio/2026 com sucesso na sua cidade.
3. Abrir `/motorista/campeonato?brandId=…` em viewport 430×761 → comparar lado a lado com as 5 referências que você enviou: header de transmissão, cards scorebug, classificação Brasileirão, chaveamento espelhado, drawer estádio.
4. Console limpo (zero warnings).

Aprova para eu implementar tudo de uma vez?

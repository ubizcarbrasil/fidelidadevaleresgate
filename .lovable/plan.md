## Etapa A — Tela do Campeonato (Motorista) com fidelidade visual às referências

Objetivo: refazer a UI de `/motorista/campeonato` espelhando as 4 referências enviadas (drawer lateral, header com seletor de temporada, classificação com colunas P/J/V/E/D/GP/SG e zona de rebaixamento vermelha, e chaveamento mata-mata em espelho com troféu). Sem mexer em backend/regras — só camada de apresentação reutilizando hooks e RPCs já existentes em `src/products/campeonato/`.

### Escopo visual (somente frontend)

1. **Header fixo (estilo print 4)**
   - Botão hamburguer à esquerda → abre drawer.
   - Centro: escudo da temporada + nome ("Campeonato Maio/2026") + sub-label "CLASSIFICAÇÃO/CHAVEAMENTO/…" conforme aba ativa.
   - Direita: botão refresh (invalida queries da aba ativa).
   - Fundo verde-escuro do tema da marca, texto claro.

2. **Drawer lateral (estilo print 3)**
   - Card no topo: escudo + "Campeonato {Mês/Ano}" + chevron "Toque para alterar" (abre bottom-sheet com temporadas anteriores/atuais — `obterTemporadasDoMotorista`).
   - Itens: Tabela de Jogos, Classificação, Artilharia, Chaveamento, Recordes, Premiação, Como funciona.
   - Item ativo destacado em verde-neon com leve fundo claro.
   - Ícones lucide (Calendar, Trophy, Target, GitBranch, Award, Gift, HelpCircle).

3. **Aba Classificação (estilo prints 1 e 2)**
   - Cabeçalho de colunas alinhado à direita: P · J · V · E · D · GP · SG.
   - Linhas com posição (azul nos top-4, branco no meio, vermelho nos últimos 4 = zona de rebaixamento), foto/escudo do motorista, nome, números monoespaçados.
   - Linha do motorista logado destacada com leve highlight + ícone "você".
   - Zona de rebaixamento separada por linha vermelha fina + linhas com cor #ef4444 no número da posição.
   - Densidade compacta para 430px.

4. **Aba Chaveamento (estilo print 5)**
   - Layout espelhado: 4 partidas à esquerda, 4 à direita, convergindo no centro com troféu 🏆.
   - "Cards" arredondados com borda verde-neon, foto + nome curto.
   - Linhas conectoras desenhadas com SVG (não divs) para fidelidade.
   - Scroll horizontal apenas se necessário; layout calibrado para 430x761.
   - Reaproveita `obterBracketV2` / `BracketResponseV2`.

5. **Demais abas (Tabela de Jogos, Artilharia, Recordes, Premiação, Como funciona)**
   - Mantêm conteúdo atual mas ganham o mesmo header + cabeçalhos com sub-label.
   - Cards de confronto (`CardDueloFutebol`) ajustados para o visual verde-neon do print 5 (borda neon, foto circular, contador "DR" para corridas).

### Arquivos a criar

```
src/products/campeonato/components/motorista/
  layout_campeonato_motorista.tsx         (header + drawer + outlet)
  drawer_campeonato_motorista.tsx         (drawer estilo print 3)
  seletor_temporada_bottomsheet.tsx       (bottom sheet "Toque para alterar")
  tabela_classificacao_futebol.tsx        (estilo prints 1/2 com zona rebaixamento)
  chaveamento_espelhado.tsx               (bracket SVG espelhado com troféu)
src/products/campeonato/styles/
  tokens_campeonato.css                   (verde-neon, zona vermelha, escuro futebol)
```

### Arquivos a editar

- `src/products/campeonato/pages/rota_campeonato_motorista.tsx` — passar a usar o novo `layout_campeonato_motorista`.
- `src/products/campeonato/components/motorista/card_duelo_futebol.tsx` — ajuste fino de borda/cor neon.
- `src/products/campeonato/components/motorista/lista_confrontos_rodada.tsx` — header de rodada com setas `< Rodada N >` (estilo print 5 do upload anterior).
- `src/index.css` — tokens `--campeonato-*` (neon, escuro, zona).

### Fora do escopo desta etapa

- Foto obrigatória bloqueando inscrição → Etapa B.
- Listagem de "próximos campeonatos" + checkout → Etapa C.
- Notificações automáticas no chat do motorista → Etapa D.
- Painel admin de agendamento futuro → Etapa E.

### Validação

- Viewport 430x761 (PWA do motorista).
- Comparar visualmente cada aba com as referências (`browser--screenshot`).
- Conferir que abrir/fechar drawer, trocar temporada e refresh funcionam sem regressão.
- Smoke test E2E existente (`tests/e2e/campeonato/01-drawer-navigation.spec.ts`) continua verde.

Confirma para eu iniciar a implementação da Etapa A?

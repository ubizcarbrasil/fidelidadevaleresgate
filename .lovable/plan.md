

## Corrigir layout mobile completo da rota /gamificacao-admin

### Problema
A tela de Gamificação Admin ainda apresenta elementos cortados e deformados no viewport mobile (430px), como visível na screenshot: cards de estatísticas cortados à esquerda, nomes de motoristas transbordando, tabs parcialmente ocultas, e tabelas das abas internas (Ranking, Moderação) sem versão mobile.

### Correções por componente

**1. `EstatisticasGamificacao.tsx` — Cards KPI**
- O grid `grid-cols-2` está ok, mas os cards internos precisam de `min-w-0` e o texto precisa de `truncate` para não estourar o container
- Adicionar `overflow-hidden` no Card para evitar o corte lateral visível na screenshot

**2. `DuelosAoVivoAdmin.tsx` — Refinamentos**
- Nomes dos motoristas no scoreboard: adicionar `max-w-[100px]` no mobile com `truncate` para nomes longos como "Aparecido de Souza Oliveira"
- Reduzir o font-size do placar de `text-2xl` para `text-xl` no mobile
- Seção de prize breakdown: usar `flex-wrap` para não transbordar

**3. `RankingAdminView.tsx` — Tabela sem versão mobile**
- Adicionar card-list mobile (igual padrão do `ListaDuelosAdmin`): posição + nome + apelido + corridas empilhados em card
- Manter Table apenas em `md+`

**4. `ModeracaoApelidos.tsx` — Tabela sem versão mobile**
- Adicionar card-list mobile: nome real, apelido (editável inline), status badge e botão de ação
- Manter Table apenas em `md+`

**5. `CinturaoAdminView.tsx` — Header do card**
- O `flex-row` no CardHeader pode quebrar no mobile com botão "Atualizar" — mudar para `flex-col gap-2 sm:flex-row sm:items-center sm:justify-between`

**6. `ConfiguracaoModulo.tsx` — Formulários**
- Grid de parâmetros `sm:grid-cols-3`: já responsivo, mas confirmar que funciona em 430px (sm = 640px, então será 1 coluna no mobile — ok)
- Grid de métricas `sm:grid-cols-2`: mesmo caso, ok
- Botão "Habilitar todos": adicionar `w-full sm:w-auto`

**7. `GamificacaoAdminPage.tsx` — Tabs**
- A TabsList com `flex overflow-x-auto` pode não mostrar indicação de scroll — adicionar `scrollbar-none` e padding para hint visual

### Arquivos a editar
- `src/components/admin/gamificacao/EstatisticasGamificacao.tsx`
- `src/components/admin/gamificacao/DuelosAoVivoAdmin.tsx`
- `src/components/admin/gamificacao/RankingAdminView.tsx`
- `src/components/admin/gamificacao/ModeracaoApelidos.tsx`
- `src/components/admin/gamificacao/CinturaoAdminView.tsx`
- `src/components/admin/gamificacao/ConfiguracaoModulo.tsx`
- `src/pages/GamificacaoAdminPage.tsx`

### Resultado
Toda a rota `/gamificacao-admin` ficará perfeitamente legível e funcional em viewport de 430px (PWA mobile), com cards empilhados no lugar de tabelas, textos truncados, botões de largura total e scroll horizontal nas tabs.


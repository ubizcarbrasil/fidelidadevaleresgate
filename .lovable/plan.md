

## Plano: Monitoramento de Pontuação por Cidade em Tempo Real

### Problema
O feed de pontuação em tempo real (`PointsFeed`) e o ranking (`RankingPontuacao`) mostram dados agregados de toda a marca, sem indicar de qual cidade cada pontuação veio. Não há como filtrar ou identificar visualmente a cidade.

### Mudanças propostas

**1. Adicionar nome da cidade em cada item do feed (`PointsFeed.tsx`)**
- Incluir `branch_id` e fazer join com `branches(name)` na query de `machine_rides`
- Exibir um badge/chip com o nome da cidade em cada registro do feed (ex: "Leme", "Pirassununga")
- Visual: badge discreto com ícone `MapPin` ao lado do horário

**2. Adicionar filtro por cidade no feed (`PointsFeed.tsx`)**
- Receber lista de branches disponíveis (query simples ou prop)
- Adicionar um `Select` no header do card: "Todas as cidades" + lista de cidades com integração ativa
- Filtrar a query de `machine_rides` por `branch_id` quando uma cidade for selecionada

**3. Adicionar nome da cidade no ranking (`RankingPontuacao.tsx`)**
- Mesma lógica: mostrar de qual cidade é cada participante do ranking
- Opcional: filtro por cidade no ranking também

**4. Buscar lista de cidades com integração ativa**
- Query em `machine_integrations` join `branches` para listar apenas cidades que realmente têm integração configurada
- Reutilizar nos dois componentes via prop passada de `DashboardChartsSection`

### Arquivos modificados
- `src/components/dashboard/PointsFeed.tsx` — adicionar branch name na query, badge de cidade, filtro select
- `src/components/dashboard/RankingPontuacao.tsx` — adicionar indicação de cidade (se aplicável ao ranking por brand)
- `src/components/dashboard/DashboardChartsSection.tsx` — buscar branches integradas e passar como prop

### Resumo
O feed e ranking passam a mostrar o nome da cidade em cada pontuação e permitem filtrar por cidade específica, tudo em tempo real.


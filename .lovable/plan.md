

## Plano de Melhorias para o Aplicativo do Cliente

Analisei o app completo (Home, Header, Tabs, Seções) e identifiquei melhorias visuais e de usabilidade organizadas por prioridade.

---

### 1. Header com Saudacao Personalizada
Hoje o header mostra apenas o logo e ícones. Adicionar uma saudacao contextual ("Bom dia, Maria!") com base no horario e nome do cliente, como fazem iFood e Nubank. Deixa o app mais humano e acolhedor.

### 2. Card de Saldo Unificado (Hero Card)
Unificar o card de "Meus Resgates" (R$) e "Meus Pontos" em um unico card hero com gradiente vibrante da marca, mostrando ambos os saldos lado a lado. Hoje sao dois blocos separados que competem por atencao. Um card unico com duas colunas (Saldo em R$ | Pontos) com icones e animacao de contagem seria mais limpo e impactante.

### 3. Acoes Rapidas com Labels Maiores e Animacao
O grid de 6 icones esta funcional, mas os labels em 10px sao dificeis de ler. Aumentar para 11px, adicionar um leve efeito de "bounce" ao tocar, e incluir um badge de contagem em "Cupons" e "Ofertas" quando houver novidades.

### 4. Banner Promocional Rotativo no Topo
Adicionar um carrossel de banners promocionais entre o Hero Card e as Acoes Rapidas. Muitos apps de fidelidade (Livelo, Dotz) usam banners no topo para destacar campanhas. Ja existe o componente `BANNER_CAROUSEL` -- basta posiciona-lo melhor na hierarquia da home.

### 5. Secao "Para Voce" com Recomendacoes
Criar uma secao personalizada baseada nas categorias que o cliente mais interage (historico de cliques/resgates). Titulo: "Selecionados para voce" com um carrossel de ofertas relevantes. Isso aumenta engajamento e conversao.

### 6. Indicador de Progresso de Nivel/Tier
Adicionar um mini progress bar no Hero Card mostrando progresso para o proximo nivel de fidelidade (se a marca usar tiers). Ex: "Faltam 230 pts para Gold". Gamificacao simples que incentiva o uso.

### 7. Melhorar Secao de Categorias
As categorias hoje usam icones com fundo quase transparente (`color12` = 7% opacidade). Aumentar a saturacao dos fundos para 15-20%, adicionar um efeito de scroll horizontal quando houver mais de 8 categorias, e incluir um contador de ofertas por categoria.

### 8. Estados Vazios Didaticos
Quando nao ha ofertas, pontos ou resgates, exibir ilustracoes SVG com textos explicativos e CTAs claros. Ex: "Voce ainda nao tem pontos. Compre em parceiros emissores para comecar a acumular!"

### 9. Micro-interacoes e Feedback Tatil
Adicionar haptic feedback (vibration API) ao favoritar, resgatar e navegar entre tabs. Incluir animacao de confetti ao completar um resgate.

### 10. Onboarding Tour para Novos Usuarios
Detectar primeiro acesso e exibir um carrossel de boas-vindas (3-4 slides) explicando: como ganhar pontos, como resgatar, como usar cupons. Componente `RedemptionSignupCarousel` ja existe -- pode ser adaptado.

---

### Detalhes Tecnicos

**Arquivos principais afetados:**
- `CustomerHomePage.tsx` -- Hero card unificado, saudacao, reordenacao de secoes
- `CustomerLayout.tsx` -- Header com saudacao, badges nos tabs
- `SegmentNavSection.tsx` -- Saturacao, scroll horizontal, contadores
- `HomeSectionsRenderer.tsx` -- Posicionamento do banner carousel
- Novo: `WelcomeTour.tsx` -- Onboarding carrossel
- Novo: `EmptyState.tsx` -- Componente reutilizavel de estado vazio

**Sem mudancas no banco de dados** -- todas as melhorias sao puramente frontend, usando dados ja disponiveis.


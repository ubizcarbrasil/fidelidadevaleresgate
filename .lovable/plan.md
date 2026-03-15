

## Plano: Modernizar UI do Painel do Parceiro (Mobile PWA)

Remodelação visual completa de todas as telas do painel do parceiro para um design moderno e sofisticado, mantendo toda a lógica de negócio intacta (regra de isolamento de camadas).

### Diretrizes de Design
- **Glassmorphism** no header e bottom bar (blur + transparência)
- **Gradientes sutis** nos KPI cards em vez de fundo branco plano
- **Ícones em containers com gradiente** (ex: bg-gradient-to-br from-blue-500 to-blue-600 com ícone branco)
- **Tipografia hierárquica** mais clara (valores grandes e bold, labels menores e light)
- **Micro-animações** usando as classes existentes (animate-fade-in, hover-scale)
- **Espaçamento e bordas** refinados (border-0, shadow mais suaves, rounded-2xl consistente)
- **Cores com opacidade** para criar profundidade visual

### Telas Afetadas

#### 1. Header + Bottom Nav (`StoreOwnerPanel.tsx`)
- Header com gradiente sutil e blur mais intenso
- Bottom bar com efeito glass, ícones com transição de escala ao ativar
- Indicador ativo animado (pill com gradiente em vez de linha fina)
- Avatar/logo da loja com borda gradiente

#### 2. Dashboard (`StoreOwnerDashboard` dentro de `StoreOwnerPanel.tsx`)
- KPI cards com gradiente de fundo (ex: from-blue-500/10 to-blue-600/5)
- Ícones em círculos com gradiente colorido
- Card de completude com gradiente e animação de progresso
- Card "vencendo em 7d" com visual mais premium
- Seletor de período com pill animada

#### 3. Cupons (`StoreCouponsTab` dentro de `StoreOwnerPanel.tsx`)
- Cards de oferta com hover sutil e shadow elevada
- Badge de status com cores mais vibrantes e rounded-full
- Botão "Criar" com gradiente primário

#### 4. Extrato (`StoreExtratoTab.tsx`)
- KPI cards com gradientes e ícones em containers coloridos
- Lista de transações com visual de timeline (linha conectora lateral)
- Filtros em chips horizontais scrolláveis em vez de selects empilhados
- Valores positivos/negativos com destaque visual forte

#### 5. Resgate (`StoreRedeemTab.tsx` + `RedemptionHistoryList.tsx` + `RedeemPinInput.tsx`)
- Input PIN com estilo OTP moderno (caixas individuais visuais)
- Card de resgate pendente com glow amber sutil
- Card de resgate encontrado com borda gradiente
- Botão confirmar com gradiente verde

#### 6. Campanhas (`StoreCampaignTab.tsx`)
- Cards de campanha com visual mais limpo e badges coloridos
- Formulário com visual de steps/wizard leve
- Card de custo estimado com destaque visual

#### 7. Ganha-Ganha (`GanhaGanhaStoreSummaryPage.tsx`)
- KPI cards com gradientes
- Tabela com alternância de cor de fundo nas linhas
- Visual consistente com as demais telas

### Arquivos a Editar

| Arquivo | Escopo |
|---------|--------|
| `src/pages/StoreOwnerPanel.tsx` | Header, bottom nav, dashboard, cupons tab |
| `src/components/store-owner/StoreExtratoTab.tsx` | KPIs, filtros, lista |
| `src/components/store-owner/RedemptionHistoryList.tsx` | Cards pendentes e usados |
| `src/components/store-owner/RedeemPinInput.tsx` | Input PIN e resultado |
| `src/components/store-owner/StoreCampaignTab.tsx` | Lista e form |
| `src/pages/GanhaGanhaStoreSummaryPage.tsx` | KPIs e tabela |
| `src/index.css` | Novos utilitários (glass-card, gradient helpers) |

### Regras
- Zero alteração em lógica de negócio, rotas, queries, mutations
- Zero alteração em contratos de dados ou banco
- Somente camada de apresentação (classes CSS, estrutura JSX visual)




## Melhorias para a Landing Page

A landing page atual é funcional mas pode ser significativamente melhorada com mais impacto visual e prova social. Aqui está o plano:

### 1. Nova seção "App Preview" -- Mockups do app do cliente
Criar um novo componente `LandingAppPreview.tsx` com mockups simulados do app do cliente dentro de molduras de celular (CSS puro, sem imagens externas). Mostrar 3 telas:
- **Home** com saldo de pontos e ações rápidas
- **Ofertas** com cards de parceiros e badges de desconto
- **Carteira** com extrato de pontos e resgates

Cada "tela" será construída com componentes HTML/CSS estilizados para parecer screenshots reais do app, dentro de um frame de celular com bordas arredondadas.

### 2. Melhorias no Hero
- Adicionar um mockup de celular ao lado do texto (layout split em desktop)
- Animação de entrada mais suave com stagger nos elementos

### 3. Nova seção "Social Proof" / Depoimentos
Criar `LandingTestimonials.tsx` com 3 depoimentos fictícios de empreendedores com avatar, nome e cargo, em cards com aspas estilizadas.

### 4. Melhorias visuais gerais
- Adicionar separadores visuais entre seções (gradientes suaves)
- Melhorar a seção "Como Funciona" com uma linha conectora entre os 3 passos
- Seção "Próximo Passo" com gradiente mais forte e contador de urgência

### Ordem das seções (atualizada)
1. Hero (com mockup do app)
2. Pain Points (existente)
3. **App Preview** (nova -- 3 mockups de tela)
4. Benefits (existente)
5. **Testimonials** (nova)
6. How It Works (melhorado)
7. Commercial Model (existente)
8. FAQ (existente)
9. Next Step (melhorado)
10. Footer (existente)

### Arquivos

| Arquivo | Ação |
|---------|------|
| `src/components/landing/LandingAppPreview.tsx` | Criar -- seção com 3 mockups de celular do app |
| `src/components/landing/LandingTestimonials.tsx` | Criar -- seção de depoimentos |
| `src/components/landing/LandingHero.tsx` | Editar -- layout split com mockup de celular |
| `src/components/landing/LandingHowItWorks.tsx` | Editar -- linha conectora entre passos |
| `src/components/landing/LandingNextStep.tsx` | Editar -- gradiente mais forte, visual mais impactante |
| `src/pages/LandingPage.tsx` | Editar -- adicionar novas seções na ordem correta |


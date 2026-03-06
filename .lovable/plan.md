

## Landing Page Pública — Vale Resgate

### Objetivo
Criar uma página pública em `/` (ou `/landing`) que apresente o produto, com seções de hero, benefícios, depoimentos e CTA direcionando para `/trial`.

### Estrutura da Página

**1. Hero Section**
- Título forte: "Seu programa de fidelidade pronto em 2 minutos"
- Subtítulo explicativo
- CTA principal → `/trial`
- Ilustração/mockup visual do app (usando gradientes e ícones)

**2. Benefícios (4-6 cards)**
- App com sua marca (logo, cores, domínio)
- Gestão de parceiros e ofertas
- Sistema de resgates com QR Code
- Relatórios e métricas
- Notificações push
- Catálogo digital

**3. Como Funciona (3 passos)**
- Cadastre-se → Configure → Publique

**4. Depoimentos (3 cards)**
- Depoimentos fictícios de lojistas satisfeitos (com nome, cargo, empresa)

**5. Preços / CTA Final**
- Destaque do trial gratuito de 30 dias
- Botão CTA → `/trial`

**6. Footer**
- Links úteis, copyright

### Implementação Técnica

| Item | Detalhe |
|------|---------|
| Arquivo | `src/pages/LandingPage.tsx` |
| Rota | `/landing` (pública, sem auth) |
| Redirect | Rota `/` para usuários não-logados redireciona para `/landing` |
| Dependências | Apenas componentes existentes (Button, Card) + Tailwind + Lucide icons + framer-motion para animações suaves |
| Responsividade | Mobile-first, grid responsivo |

### Rota no App.tsx
- Adicionar `<Route path="/landing" element={<LandingPage />} />` nas rotas públicas
- O Dashboard atual em `/` continuará protegido para usuários logados

### Estimativa
- 1 arquivo novo (`LandingPage.tsx`)
- 1 pequena alteração no `App.tsx` (adicionar rota)


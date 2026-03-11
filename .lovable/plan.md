

## Plano: Restaurar manualmente os componentes da Landing Principal (/landing)

O revert pelo histórico não funcionou. Vou restaurar manualmente os 11 arquivos de componentes da landing principal que foram modificados por engano.

### Arquivos que serão reescritos

Todos em `src/components/landing/`:

1. **LandingHero.tsx** — Restaurar hero focado no empreendedor que quer CRIAR seu programa de fidelidade (white-label), não "ser parceiro"
2. **LandingBenefits.tsx** — Benefícios da plataforma para emissores (white-label, CRM, app próprio)
3. **LandingAppPreview.tsx** — Mockups de celular mostrando o app customizável
4. **LandingHowItWorks.tsx** — Fluxo de como o empreendedor monta o programa
5. **LandingWhiteLabel.tsx** — Seção de marca própria (já parece ok, vou preservar)
6. **LandingCommercialModel.tsx** — Modelos comerciais para emissores
7. **LandingCRM.tsx** — Seção de CRM integrado (já parece ok, vou preservar)
8. **LandingTestimonials.tsx** — Depoimentos de empreendedores
9. **LandingFAQ.tsx** — FAQ sobre a plataforma (não sobre ser parceiro de resgate)
10. **LandingNextStep.tsx** — CTA final para cadastro
11. **LandingFooter.tsx** — Footer

### Abordagem

- Reescrever cada componente com conteúdo focado no **empreendedor/emissor** (quem CRIA o programa de fidelidade usando Vale Resgate como plataforma white-label)
- Manter o mesmo design system (dark theme, emerald accents, framer-motion animations, glassmorphism)
- Diferenciar claramente do conteúdo da Partner Landing Page (`/:slug/parceiro`), que é focada em lojas que ACEITAM resgate

### O que NÃO muda
- `LandingPage.tsx` (apenas importa os componentes)
- `PartnerLandingPage.tsx` (já está redesenhada e correta)
- Nenhuma migração de banco


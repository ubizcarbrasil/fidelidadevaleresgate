

## Análise

Verifiquei o código e as duas mudanças solicitadas anteriormente **já estão implementadas**:

1. **Landing Page** (`/landing`): Já possui hero, pain points, benefícios, depoimentos e múltiplos CTAs para o trial de 30 dias
2. **Guia passo a passo** (`/trial`): Já possui a etapa "guide" com 6 passos visuais antes do cadastro

Porém, comparando com o site real **valeresgate.com.br**, a landing page atual tem diferenças visuais significativas. O plano abaixo alinha melhor com o site oficial.

## Plano de Alinhamento com valeresgate.com.br

### 1. Atualizar Landing Page para espelhar o site oficial

**Seções a adicionar/ajustar no `src/pages/LandingPage.tsx`:**

| Seção | O que mudar |
|-------|------------|
| **Navbar** | Adicionar links "Modelo Comercial", "FAQ", "Próximo Passo" como no site oficial |
| **Hero** | Trocar "clientes" por "passageiros" onde aplicável (alinhado ao texto do site); adicionar badge "WhatsApp API incluso" nos checks |
| **Benefits** | Atualizar textos para espelhar os 3 benefícios do site: "Pontos que retêm", "Suporte total", "App fácil de usar" com descrições reais |
| **FAQ** | Adicionar seção de FAQ usando Accordion com perguntas do site |
| **Modelo Comercial** | Adicionar seção explicando o modelo de negócio |
| **Próximo Passo** | Seção final com CTA mais prominente e formulário inline |

### 2. Manter o guia passo a passo no Trial (já implementado)

O guia no `/trial` já está funcional — nenhuma mudança necessária.

### Arquivos alterados
- `src/pages/LandingPage.tsx` — reescrever para alinhar com o design e conteúdo do site oficial


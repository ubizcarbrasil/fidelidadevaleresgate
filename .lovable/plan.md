

# Melhorar Landing de Produtos + Corrigir Domínio dos Links

## Diagnóstico

### Problema 1 — Link errado
Em `passo_revisao.tsx` (linha 16) e `pagina_produtos_comerciais.tsx` (linha 63), o link público é montado com `window.location.origin`. Quando o admin está editando dentro do editor Lovable, isso vira `https://3ff47979-…lovableproject.com/p/produto/motorista-premium` — um link de preview que clientes não devem receber.

O domínio canônico **da plataforma SaaS** (Vale Resgate, onde produtos comerciais ficam hospedados) é `https://app.valeresgate.com.br`. Os manuais já documentam isso (`dados_manuais.ts` linha 1530-1531). Precisa ser fixo, não inferido do navegador.

### Problema 2 — Landing fraca
A landing atual (`pagina_landing_produto.tsx`) tem só:
- Hero simples com headline + preço + benefícios em 2 colunas
- Screenshots / depoimentos / FAQ (todos opcionais — geralmente vazios)
- Footer

Falta o que faz uma página vender: **gancho emocional**, **prova de valor visualizada**, **comparativo "antes/depois"**, **objecções respondidas inline**, **urgência/garantia**, **micro-prova social distribuída**, **CTAs sticky**.

## Ajuste

### 1. Centralizar origem pública dos produtos

Criar `src/features/produtos_comerciais/utils/utilitarios_link_publico.ts`:

```ts
const PRODUCT_LANDING_ORIGIN = "https://app.valeresgate.com.br";

export function montarLinkLanding(slug: string, opts?: { cycle?: "monthly" | "yearly" }) {
  const params = opts?.cycle === "yearly" ? "?cycle=yearly" : "";
  return `${PRODUCT_LANDING_ORIGIN}/p/produto/${slug}${params}`;
}

export function montarLinkTrial(slug: string, opts?: { cycle?: "monthly" | "yearly" }) {
  const params = opts?.cycle ? `&cycle=${opts.cycle}` : "";
  return `${PRODUCT_LANDING_ORIGIN}/trial?plan=${slug}${params}`;
}
```

Atualizar dois arquivos para consumir esses helpers (em vez de `window.location.origin`):
- `src/features/produtos_comerciais/components/passo_revisao.tsx` — links exibidos/copiados
- `src/features/produtos_comerciais/pagina_produtos_comerciais.tsx` — botão "Abrir landing" e "Copiar link de trial"

Resultado: o link copiado/aberto será sempre `https://app.valeresgate.com.br/p/produto/{slug}`, independente de onde o admin estiver navegando.

### 2. Reformular a landing pública (`pagina_landing_produto.tsx`)

Reescrever a página em **componentes próprios** dentro de `src/features/landing_produto/components/` (componentização extrema, conforme regra do workspace):

**Nova estrutura visual (top → bottom):**

1. **`bloco_topbar.tsx`** — barra fixa com logo + "Já tenho conta" + CTA pill de trial (sempre visível ao rolar)

2. **`bloco_hero.tsx`** (renovado)
   - Eyebrow tag colorida ("PARA EMPRESAS DE MOBILIDADE", configurável via `lc.eyebrow`)
   - Headline grande (gradient sutil na cor primária)
   - Subheadline
   - **Trust strip inline**: "✓ 30 dias grátis · ✓ Sem cartão · ✓ Cancele quando quiser · ✓ Suporte humano"
   - Hero image com **moldura de device** (mockup tablet/celular) e glow colorido por trás
   - 2 CTAs: primário (cor da marca, "Começar trial") + secundário ghost ("Ver demonstração" → âncora `#preview`)
   - Mini-prova social abaixo: "Já em uso por X cidades" + 4-5 logos genéricos cinzas (ou avatares circulares)

3. **`bloco_metricas_destaque.tsx`** (novo)
   - Faixa horizontal com 3-4 números grandes ("+30% engajamento", "10x mais resgates", "Setup em 24h")
   - Configurável via `lc.metrics?: Array<{value, label}>` — se vazio, esconde a seção
   - Visual: cartões translúcidos com borda colorida sutil

4. **`bloco_dores_solucoes.tsx`** (novo) — Antes vs Depois
   - 2 colunas: "Sem [Produto]" (X vermelho, dores) vs "Com [Produto]" (✓ verde, soluções)
   - Configurável via `lc.problems?: string[]` e `lc.solutions?: string[]`
   - Se ambos vazios: esconde a seção

5. **`bloco_funcionalidades_grid.tsx`** (renovado a partir do "Benefits")
   - Grid 2x3 ou 3x2 de cards com **ícone + título + descrição curta**
   - Hoje os benefícios são só strings — vamos enriquecer aceitando objeto `{title, description, icon?}`. Mantém retrocompatibilidade: se vier string, usa ícone padrão `Check` e mostra só o texto.
   - Visual moderno com hover sutil

6. **`bloco_pricing_destaque.tsx`** (renovado)
   - Card centralizado, mais alto, com selo "MAIS POPULAR" se `is_popular`
   - Toggle Mensal/Anual já existe — mantém
   - Mostra preço grande + "/mês" + economia anual em badge verde
   - Lista 5-6 incluídos (compacta)
   - CTA grande full-width
   - Garantia abaixo: "🛡️ 30 dias de teste · sem cartão de crédito · cancele em 1 clique"

7. **`bloco_preview_app.tsx`** (novo, âncora `#preview`)
   - Se houver screenshots, exibe carrossel maior; senão usa hero image em destaque
   - Texto lateral: "Veja como funciona na prática" + 3 bullets curtos

8. **`bloco_depoimentos.tsx`** (já existe, manter — só estilizar levemente)

9. **`bloco_perguntas_objeções.tsx`** (FAQ enriquecido — substitui `bloco_faq.tsx` na renderização)
   - Mesmo dado (`lc.faq`), mas com **2 perguntas-âncora padrão** sempre presentes mesmo se admin não cadastrar:
     - "E se eu não gostar?" → "Você cancela em 1 clique nos 30 dias e nada é cobrado."
     - "Preciso instalar algo?" → "Não. É 100% web — funciona no celular dos seus motoristas pelo navegador."
   - Layout accordion compacto

10. **`bloco_cta_final.tsx`** (novo)
    - Faixa de fundo gradiente forte na cor primária
    - "Pronto para começar?" + "Comece seu trial gratuito de {trial_days} dias"
    - CTA branco grande
    - Sub-texto: "Sem cartão. Sem amarras."

11. **`bloco_footer.tsx`** (já existe inline — extrair)

**CTA Sticky mobile**
- Botão flutuante full-width na parte de baixo da tela em telas <768px com "Começar trial grátis" — porque a landing fica longa e o cliente pode rolar bastante.

### 3. Estender tipos (`tipos_produto.ts`)

Adicionar campos OPCIONAIS em `landing_config_json` (sem migração — é JSONB):
- `eyebrow?: string`
- `metrics?: Array<{ value: string; label: string }>`
- `problems?: string[]`
- `solutions?: string[]`
- `benefits` continua aceitando `string[]` mas também `Array<{title: string; description?: string; icon?: string}>` (parser tolerante)

Esses campos ficam **opcionais** — produtos antigos continuam funcionando, apenas com versão simples. Nenhum dado obrigatório novo.

### 4. (Opcional, recomendado) Adicionar 2 campos no editor

Em `passo_landing_beneficios.tsx` adicionar 2 mini-seções extras (collapsibles):
- **"Métricas de impacto"** (até 4 itens valor+label)
- **"Dores que você resolve"** (até 5 dores) e **"Como você resolve"** (até 5 soluções)

Se o admin não preencher, as seções correspondentes simplesmente não renderizam na landing.

> Posso fazer só a reformulação visual usando os campos atuais e deixar os novos campos do editor para depois — me confirme abaixo se prefere.

## Pergunta opcional (não bloqueia)

Quer que eu também adicione **agora** os campos novos no editor (métricas, dores, soluções, eyebrow) ou só a reformulação visual com os campos atuais?
- (a) Só a reformulação visual + correção do domínio (mais rápido, ~10 min)
- (b) Reformulação completa + campos novos no editor (mais valor, ~15 min)

Padrão se não responder: **(b)** — mais completo e o editor ganha poder de personalização real.

## O que NÃO vou mexer

- ❌ Banco / RLS / edge functions (campos novos vão no JSONB existente)
- ❌ Fluxo de trial (`TrialSignupPage`) — só recebe os mesmos parâmetros
- ❌ Preview interno (`preview_landing.tsx`) — pode ser ajustado em outra rodada se quiser
- ❌ Catálogo público (`pagina_catalogo_produtos.tsx`) — escopo separado
- ❌ Origem dos demais links da plataforma (driver, marca, etc.) — só os links de **produtos comerciais**

## Resultado esperado

- Botão "Abrir landing" e "Copiar link" geram sempre `https://app.valeresgate.com.br/p/produto/{slug}`
- Landing pública vira página de venda real: hero forte, métricas, comparativo, funcionalidades visuais, preço com garantia, prova social, FAQ com objeções, CTA final + sticky mobile
- Mantém todos os dados antigos funcionando (campos novos são opcionais)
- Visual coerente com `design_system.md` (dark mode friendly, espaçamentos consistentes, componentização extrema)

## Risco

Baixo. Reescrita é em arquivos isolados da feature; tipos antigos continuam compatíveis; correção do domínio é trocar 4 referências por helpers. Build esperado limpo.

## Estimativa

~12-15 min.


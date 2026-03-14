

# Plano: Interface Mobile PWA para Importação em Massa de Achadinhos

## Contexto
A página atual de Achadinhos (`AffiliateDealsPage`) é desktop-first com tabelas e tabs complexas. O usuário quer uma interface **dedicada, mobile-first e didática** para importar achadinhos em massa pelo celular.

## Nova Página: `src/pages/AchadinhosMobileImportPage.tsx`

### Estrutura (fluxo em etapas tipo wizard)

**Step 1 — Escolha do método**
- Card grande com ícone: "Colar Links" (cole vários links de produtos, um por linha)
- Card grande com ícone: "Importar Planilha" (upload de CSV)
- Ambos com descrição didática curta

**Step 2a — Colar Links**
- `<textarea>` fullwidth com placeholder "Cole os links aqui, um por linha"
- Botão "Buscar Produtos" que dispara scrape-product para cada URL em paralelo (max 5 simultâneos)
- Progress bar mostrando "Buscando 3 de 10..."
- Cada produto encontrado aparece como card mobile com: imagem, título, preço, loja
- Possibilidade de remover itens individuais com swipe ou X

**Step 2b — Importar CSV**
- Botão grande "Escolher Arquivo" com ícone de upload
- Botão "Baixar Template" para CSV de exemplo
- Preview dos dados em cards (não tabela) — cada card mostra imagem + título + preço
- Contador: "12 produtos carregados"

**Step 3 — Revisão e Envio**
- Lista de cards dos produtos a importar com mini-preview
- Resumo: "X achadinhos prontos para publicar"
- Botão CTA grande "Publicar Achadinhos" com loading state
- Progress bar durante importação
- Tela de sucesso com confetti/check animado

### Design Mobile-First
- Layout `max-w-lg mx-auto` com `px-4` padding
- Cards empilhados verticalmente (nenhuma tabela)
- Botões fullwidth com `h-12` para toque fácil
- Indicador de etapa no topo (dots ou stepper)
- Safe area padding para PWA (`pb-safe`)
- Header fixo com botão voltar e título "Importar Achadinhos"

### Rota
- Adicionar rota `/affiliate-deals/import-mobile` dentro do bloco protegido existente em `App.tsx`
- Lazy-load da página

### Arquivos Modificados
1. **Criar** `src/pages/AchadinhosMobileImportPage.tsx` — página completa com wizard de 3 etapas
2. **Editar** `src/App.tsx` — adicionar lazy import + rota
3. **Editar** `src/pages/AffiliateDealsPage.tsx` — adicionar botão/link "Importar pelo Celular" que direciona para a nova rota

### Dependências Existentes Reutilizadas
- `supabase.functions.invoke("scrape-product")` para auto-preenchimento
- `supabase.from("affiliate_deals").insert()` para salvar
- `useBrandGuard()` para brand context
- Componentes UI: Button, Card, Progress, Badge, Input
- `framer-motion` para animações de cards


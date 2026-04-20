

# Modo Vitrine Manual quando Achadinhos está OFF

## Diagnóstico

Hoje a página **Produtos de Resgate** assume que existe Achadinhos ativo:
- O modal "Adicionar Produtos ao Resgate" lista produtos já existentes em `affiliate_deals` (vindos de scraping de marketplaces como Mercado Livre)
- O empty state empurra o usuário para `/affiliate-deals` (que pode estar bloqueado pelo `ModuleGuard moduleKey="affiliate_deals"`)
- O botão "Ir para Achadinhos" e o título "Adicionar Produtos ao Resgate" mencionam funcionalidade que o cliente não contratou

Para marcas como **Drive Engajamento** (Premium Motorista, sem `affiliate_deals`), o resultado é confuso: aparecem produtos de marketplace que não fazem sentido, e o caminho de adicionar é truncado.

A página existe (e deve continuar existindo) porque o módulo `product_redemptions` está incluído em planos motorista. O que falta é um **modo manual** para criar produtos próprios da vitrine sem depender de scraping de marketplace.

## O que vou fazer

### 1. Detectar se Achadinhos está ativo (`ProdutosResgatePage.tsx`)
Usar `useProductScope` para checar `escopo.hasModuleKey("affiliate_deals")`. Resultado: `achadinhosAtivo: boolean`.

### 2. Empty state contextual
- **Se Achadinhos ATIVO:** mantém o estado atual ("Ir para Achadinhos")
- **Se Achadinhos OFF:** muda mensagem para "Crie produtos para sua vitrine de resgate" e o CTA principal vira **"+ Criar Produto"**, abrindo o novo modal manual (não o atual)

### 3. Botão "Adicionar" do header se adapta
- **Se Achadinhos ATIVO:** texto continua "Adicionar Produtos" → abre modal atual (escolher de achadinhos importados)
- **Se Achadinhos OFF:** texto vira "Criar Produto" → abre o **novo modal manual**

### 4. Novo componente: `ModalCriarProdutoManual.tsx`
Arquivo novo em `src/pages/produtos_resgate/components/`. Formulário fluído com:
- **Imagem do produto** — upload via `StorageImageUpload` para bucket `brand-assets/produtos-resgate/`
- **Título** (obrigatório)
- **Descrição** (opcional, textarea)
- **Preço em R$** (opcional — se preenchido, habilita cálculo automático)
- **Público-alvo** — Motorista / Cliente / Ambos (já filtrado pelo `useProductScope` para mostrar só audiências do plano)
- **Toggle "Calcular pontos automaticamente"** — usa preço × taxa da cidade (`useRegrasResgateCidade`)
- **Custo em pontos** — campo manual; auto-preenchido quando toggle ON e preço informado; editável quando toggle OFF
- Insere em `affiliate_deals` com:
  - `brand_id`, `branch_id` (do `useBrandGuard`)
  - `is_active: true`, `is_redeemable: true`
  - `affiliate_url: null` (produto manual, sem link externo)
  - `store_name: null` (não é de marketplace)
  - `redeem_points_cost`, `redeemable_by`
  - `image_url`, `title`, `description`, `price`

### 5. Modal atual (`ModalAdicionarResgatavel.tsx`) só aparece quando Achadinhos ATIVO
Não mexo na lógica interna. Apenas o botão que abre ele só existe quando `achadinhosAtivo === true`.

### 6. Listagem de produtos (tabela) funciona igual nos dois modos
A tabela já mostra `affiliate_deals.is_redeemable = true` filtrado por brand — produtos manuais aparecem na mesma lista, com a mesma UI de edição (toggle ativo, editar custo, editar público).

### 7. Botão "Editar" do produto (modal `ModalEditarResgatavel.tsx`)
Já funciona pra qualquer produto — não precisa mexer. Continua editando custo, público e taxa personalizada.

## Resultado esperado

**Plano sem Achadinhos (ex: Engajamento Motorista Premium):**
- Header: botão **"+ Criar Produto"**
- Empty state: "Crie produtos para sua vitrine de resgate" + CTA "Criar Primeiro Produto"
- Modal aberto: formulário de criação manual (imagem + título + preço + cálculo automático ou manual de pontos)
- Sem menção a "Achadinhos", sem listagem de produtos de marketplace

**Plano com Achadinhos:**
- Header: botão **"+ Adicionar Produtos"** (igual hoje)
- Empty state: "Ir para Achadinhos" (igual hoje)
- Modal aberto: lista de produtos importados (igual hoje)
- Bonus: Pode adicionar um botão secundário "Criar Manual" pra também usar o modo manual quando quiser, mas esse é opcional — confirmo abaixo.

## Pergunta opcional (não bloqueia o plano)

Quando Achadinhos **estiver ativo**, você quer:
- (a) **Só** o botão "Adicionar Produtos" (importar de achadinhos), como hoje
- (b) **Dois** botões: "Adicionar de Achadinhos" + "Criar Manual" (mais opções)

Por padrão vou fazer (a) pra não poluir, mas se preferir (b) é só dizer.

## O que NÃO vou mexer

- ❌ Banco / RLS / edge functions (a tabela `affiliate_deals` já aceita produtos sem `affiliate_url`)
- ❌ Lógica de scraping (`scrape-product`)
- ❌ Página de Achadinhos (`/affiliate-deals`)
- ❌ Modal de edição (`ModalEditarResgatavel`)
- ❌ Tabela e KPIs da página
- ❌ App do motorista/cliente — produtos manuais aparecem no resgate normalmente porque `is_redeemable = true`

## Risco

Baixo. Adiciono um componente novo, condiciono UI por flag de plano, e reuso `StorageImageUpload`/`useRegrasResgateCidade` que já existem. Build esperado limpo.

## Estimativa

~10 min.


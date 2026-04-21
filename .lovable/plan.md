

# Página dedicada de agendamento de demonstração + captação de leads B2B

## O que vou entregar

Uma página `/p/produto/:slug/demo` (ex: `/p/produto/motorista-premium/demo`) com formulário comercial profissional, gravação dos leads no banco com isolamento por produto/marca, notificação para o time comercial e tela de confirmação com próximos passos.

## Estrutura técnica

### 1. Backend — nova tabela `commercial_leads`

Migração SQL criando tabela para captação de leads B2B do site institucional dos produtos:

```
commercial_leads
├── id (uuid, PK)
├── product_id (uuid → commercial_products / subscription_plans)
├── product_slug (text — redundância para resiliência)
├── full_name (text, NOT NULL)
├── work_email (text, NOT NULL)
├── phone (text, NOT NULL)
├── company_name (text, NOT NULL)
├── company_role (text)               -- cargo (CEO, Head Operações etc.)
├── company_size (text)               -- faixa de motoristas (1-50, 50-200, 200+)
├── city (text)                       -- cidade de operação
├── current_solution (text)           -- usa app próprio? terceiro? nenhum?
├── interest_message (text)           -- campo livre
├── preferred_contact (text)          -- whatsapp / email / ligação
├── preferred_window (text)           -- manhã / tarde / noite
├── source (text)                     -- 'landing_produto' / 'cta_final' / 'pricing'
├── utm_source / utm_medium / utm_campaign (text)
├── status (text DEFAULT 'novo')      -- novo / contatado / qualificado / convertido / descartado
├── assigned_to (uuid)                -- admin responsável
├── notes (text)                      -- anotações internas
├── created_at / updated_at (timestamptz)
```

**RLS:**
- `INSERT`: público anônimo permitido (formulário público)
- `SELECT/UPDATE`: apenas Root Admin (via `has_role(auth.uid(), 'admin')`)
- Trigger `updated_at` automático

**Validação por trigger** (não CHECK): email com formato válido, telefone com mínimo de dígitos, anti-spam por rate-limit de IP via `pg_net` (1 request por IP a cada 60s).

### 2. Edge Function `submit-commercial-lead`

- Recebe payload do formulário (público, sem JWT)
- Valida com Zod no servidor (defesa em profundidade)
- Insere em `commercial_leads`
- Dispara `admin_notifications` para o Root Admin (segue padrão do `entrepreneur-notifications`)
- Envia email transacional para o time comercial (via Lovable Emails se configurado, senão registra apenas)
- Opcional: webhook Telegram se `TELEGRAM_LEADS_WEBHOOK` existir
- Retorna `{ success, lead_id }` para a página exibir tela de sucesso

### 3. Frontend — nova feature `agendar_demonstracao`

Estrutura padrão do workspace:

```
src/features/agendar_demonstracao/
├── pagina_agendar_demonstracao.tsx
├── components/
│   ├── bloco_topbar_demo.tsx             — topbar coerente com landing
│   ├── bloco_header_demo.tsx             — headline + valor da demo
│   ├── formulario_agendar_demo.tsx       — formulário principal (react-hook-form + zod)
│   ├── bloco_beneficios_demo.tsx         — 4 cards "o que você verá na demo"
│   ├── bloco_resumo_produto.tsx          — sidebar mostrando produto escolhido
│   ├── bloco_prova_social_compacta.tsx   — 2 logos/depoimentos curtos
│   └── bloco_sucesso_demo.tsx            — tela pós-envio
├── hooks/
│   └── hook_submeter_lead.ts             — useMutationWithFeedback
├── services/
│   └── servico_leads.ts                  — chamada à edge function
├── schemas/
│   └── schema_agendar_demo.ts            — validação zod
├── types/
│   └── tipos_lead.ts
└── constants/
    └── constantes_demo.ts                — opções de cargo, tamanho, faixa
```

### 4. UX da página `/p/produto/:slug/demo`

**Layout 2 colunas (desktop) / empilhado (mobile):**

**Coluna esquerda (60%) — formulário:**
- Headline: "Agende uma demonstração do {ProdutoNome}"
- Subtítulo: "Em 30 minutos você vê o produto rodando com dados reais do setor de mobilidade."
- Formulário com campos agrupados em 3 seções visuais:
  1. **Sobre você**: Nome, email corporativo, telefone/WhatsApp, cargo
  2. **Sobre sua operação**: Empresa, cidade, faixa de motoristas, solução atual
  3. **Sobre a demo**: Janela preferida (manhã/tarde/noite), canal preferido, o que quer ver (campo livre)
- Botão CTA grande: "Agendar demonstração"
- Microcopy: "Resposta em até 1 dia útil · Seus dados estão protegidos pela LGPD"

**Coluna direita (40%) — sticky:**
- Card com nome do produto, ícone, eyebrow, 3 bullets de "o que você verá":
  - "Demonstração ao vivo da plataforma"
  - "Apresentação de cases reais do setor"
  - "Proposta personalizada para sua operação"
- Mini depoimento (1 só, curto)
- Trust badges: "LGPD · Setup em 7 dias · Suporte dedicado"

**Tela de sucesso (substitui formulário após envio):**
- Ícone de check grande
- "Demonstração solicitada com sucesso"
- "Nosso time comercial vai te contatar em até 1 dia útil pelo {canal escolhido}"
- Próximos passos numerados (1. Contato → 2. Agendamento → 3. Demo de 30min → 4. Proposta)
- CTA secundário: "Voltar ao site" + "Ver outros produtos"

### 5. Integração com a landing page existente

Atualizar componentes que hoje apontam para `/trial`:

- **`bloco_hero.tsx`**: CTA principal "Agendar demonstração" → `/p/produto/{slug}/demo`. CTA secundário "Ver como funciona" → âncora `#como-funciona`.
- **`bloco_topbar.tsx`**: botão "Agendar demo" → `/p/produto/{slug}/demo`
- **`bloco_pricing_destaque.tsx`**: "Agendar demonstração comercial" → `/p/produto/{slug}/demo`. Manter "Quero ver funcionando" → `/trial`.
- **`bloco_cta_final.tsx`**: "Agendar demonstração" → `/p/produto/{slug}/demo`. "Falar com especialista" mantém o `mailto:` ou também passa a abrir a página `/demo` com `?source=cta_final`.

UTMs e source são preservados via query string (`?source=hero`, `?source=pricing`, etc.) e gravados no lead.

### 6. Painel admin — visualização dos leads

Adicionar item **"Leads Comerciais"** no menu Root Admin com página `src/features/leads_comerciais/`:

- Listagem com filtros (produto, status, período, cidade, faixa de motoristas)
- Cards de KPI: total no mês, taxa de conversão, leads por produto
- Drawer lateral com detalhe completo do lead + histórico de status + campo de notas
- Botão "Marcar como contatado / qualificado / convertido / descartado"
- Botão "Abrir WhatsApp" (formata número e mensagem inicial)
- Export CSV

### 7. Roteamento

`src/App.tsx`: adicionar rota pública (sem auth) antes de `/p/produto/:slug`:

```
<Route path="/p/produto/:slug/demo" element={<PaginaAgendarDemonstracao />} />
<Route path="/p/produto/:slug" element={<PaginaLandingProduto />} />
```

E rota admin para gestão:
```
<Route path="/leads-comerciais" element={<RootGuard><PaginaLeadsComerciais /></RootGuard>} />
```

## Arquivos a criar / editar

**Criar:**
1. Migração SQL: tabela `commercial_leads` + RLS + triggers
2. `supabase/functions/submit-commercial-lead/index.ts`
3. Toda a feature `src/features/agendar_demonstracao/` (página + 7 componentes + hook + service + schema + types + constants)
4. Toda a feature `src/features/leads_comerciais/` (página de gestão + componentes)

**Editar:**
5. `src/App.tsx` — 2 novas rotas
6. `src/features/landing_produto/pagina_landing_produto.tsx` — passar `demoUrl` para os blocos
7. `src/features/landing_produto/components/bloco_hero.tsx` — CTA aponta para `/demo`
8. `src/features/landing_produto/components/bloco_topbar.tsx` — botão aponta para `/demo`
9. `src/features/landing_produto/components/bloco_pricing_destaque.tsx` — CTA primário para `/demo`
10. `src/features/landing_produto/components/bloco_cta_final.tsx` — CTA primário para `/demo`
11. `src/compartilhados/constants/constantes_menu.ts` (ou registry) — entrada "Leads Comerciais" no menu Root

## O que NÃO vou mexer

- ❌ Fluxo de `/trial` (continua funcionando para auto-serviço)
- ❌ `subscription_plans` / `commercial_products` (não precisa de mudança)
- ❌ AuthContext / BrandContext (página `/demo` é pública, não passa por bootstrap)
- ❌ RLS de outras tabelas
- ❌ Layout/copy da landing principal além dos CTAs

## Resultado esperado

- URL pública: `/p/produto/motorista-premium/demo`
- Formulário B2B completo com validação Zod e máscaras
- Lead gravado em `commercial_leads` com produto vinculado, source e UTMs
- Notificação em tempo real no painel Root Admin
- Tela de sucesso com próximos passos
- Painel `/leads-comerciais` para o time comercial gerir o pipeline
- Landing page com CTAs apontando para a nova página em vez de pular direto para o trial

## Risco

Baixo a médio. Tabela e edge function são novas (não afetam nada existente). Mudanças nos blocos da landing são apenas em props de URL (`demoUrl` em vez de `trialUrl` no botão primário). A página de gestão admin é aditiva.

## Estimativa

~25 min.


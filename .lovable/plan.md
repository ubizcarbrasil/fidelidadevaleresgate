

## Plano: 3 Correções — Domínio, Rota Pública de Loja, Links Úteis

---

### 1. Domínio `.com.br` no provisionamento

**Arquivo:** `supabase/functions/provision-brand/index.ts` (linha 495)

Trocar `valeresgate.com` → `valeresgate.com.br`:

```typescript
// ANTES
const domainValue = subdomain ? `${subdomain}.valeresgate.com` : `${brand_slug}.valeresgate.com`;
// DEPOIS
const domainValue = subdomain ? `${subdomain}.valeresgate.com.br` : `${brand_slug}.valeresgate.com.br`;
```

Apenas brands novas serão afetadas.

---

### 2. Nova rota pública `/loja/:slug`

Criar feature `src/features/loja_publica/` com:

| Arquivo | Responsabilidade |
|---------|-----------------|
| `pagina_loja_publica.tsx` | Página principal — resolve slug, busca store, renderiza |
| `components/cabecalho_loja.tsx` | Logo, nome, segmento, descrição |
| `components/info_contato_loja.tsx` | WhatsApp, Instagram, Site, Endereço |
| `components/horario_funcionamento.tsx` | Renderiza `operating_hours_json` |
| `components/galeria_loja.tsx` | Grid de fotos da `gallery_urls` |
| `components/faq_loja.tsx` | Accordion com `faq_json` |

**Lógica:**
- Rota pública, sem autenticação
- Pega `:slug` da URL + `brand_id` do `BrandContext`
- Query: `stores` onde `slug = :slug AND brand_id = brand.id AND is_active = true AND approval_status = 'APPROVED'`
- Se não encontrar → 404 estilizado
- Usa tema da brand (cores do BrandContext)
- Botão "Voltar" → `/`

**Colunas utilizadas:** `name`, `logo_url`, `segment`, `category`, `description`, `address`, `whatsapp`, `instagram`, `site_url`, `operating_hours_json`, `gallery_urls`, `faq_json`, `banner_url`

**Registro em `App.tsx`:** Adicionar rota `/loja/:slug` com `lazyWithRetry`, no bloco de rotas públicas.

---

### 3. Links Úteis — URLs dinâmicas por brand

**Arquivo:** `src/components/dashboard/DashboardQuickLinks.tsx` — componente `BrandQuickLinks`

**Mudanças:**
- Buscar domínio primário da brand (excluindo `app.valeresgate.com.br`) via query em `brand_domains`
- Separar links em **externos** (usam domínio da brand) e **internos** (rotas do painel admin)
- Links externos: App Cliente, Cadastro Parceiro, Painel Parceiro, Achadinho Motorista
- Links internos: Painel Franqueado, Gamificação, Módulos, Regras de Resgate, Produtos de Resgate, Conversão por Público
- Se brand sem domínio → mostrar aviso "Configure um domínio em Meus Domínios para ativar este link" e desabilitar botões Abrir/Copiar dos links externos
- Botão "Abrir" de links externos → `window.open(url, "_blank")`
- Botão "Copiar" → copia URL completa resolvida com domínio da brand

**Estrutura dos links externos:**
```typescript
const linksExternos = [
  { label: "App do Cliente", path: "/", icon: ExternalLink },
  { label: "Cadastro Parceiro", path: "/partner-landing", icon: ShoppingBag },
  { label: "Painel Parceiro", path: "/store-panel", icon: Store },
  { label: "Achadinho Motorista", path: `/driver?brandId=${currentBrandId}`, icon: Car },
];
// URL = `https://${brandDomain}${path}`
```

---

### Resumo de arquivos

| Ação | Arquivo |
|------|---------|
| Editar | `supabase/functions/provision-brand/index.ts` |
| Criar | `src/features/loja_publica/pagina_loja_publica.tsx` |
| Criar | `src/features/loja_publica/components/cabecalho_loja.tsx` |
| Criar | `src/features/loja_publica/components/info_contato_loja.tsx` |
| Criar | `src/features/loja_publica/components/horario_funcionamento.tsx` |
| Criar | `src/features/loja_publica/components/galeria_loja.tsx` |
| Criar | `src/features/loja_publica/components/faq_loja.tsx` |
| Editar | `src/App.tsx` (adicionar rota `/loja/:slug`) |
| Editar | `src/components/dashboard/DashboardQuickLinks.tsx` |


# Ubiz Ofertas — Modo Vitrine Pública

Criar um novo "modo de entrada" público chamado **Ubiz Ofertas**, que é uma versão somente-vitrine do Achadinhos (mesma fonte `affiliate_deals`), sem nenhum elemento de pontuação ou gamificação.

## O que fica visível

- Header com logo da marca
- Banners (HomeSectionsRenderer)
- Categorias ativas (mesma listagem do Achadinhos)
- Vitrines de ofertas (Novas Ofertas, Em Destaque)
- Página de categoria (lista de ofertas filtradas)
- Detalhe da oferta com botão "Ver oferta" abrindo `affiliate_url` em nova aba
- Busca de ofertas
- Compartilhamento da página

## O que NÃO aparece

- Card de saldo/pontos
- "Resgatar com Pontos" / `is_redeemable`
- Botões "Resgate na Cidade", "Comprar Pontos", "Campeonato", "Duelos"
- Botão flutuante de WhatsApp / suporte
- Apostas, ranking, cinturão
- Login / impersonação de motorista (rota 100% pública)

## Arquitetura (feature-based, pt-BR)

Nova feature `src/features/ubiz_ofertas/`:

```text
src/features/ubiz_ofertas/
├── pagina_ubiz_ofertas.tsx          # rota pública /ofertas
├── components/
│   ├── cabecalho_ofertas.tsx        # logo + busca + share
│   ├── vitrine_ofertas.tsx          # carrossel de ofertas
│   ├── grade_categorias_ofertas.tsx # categorias clicáveis
│   ├── pagina_categoria_ofertas.tsx # lista filtrada por categoria
│   ├── detalhe_oferta.tsx           # modal/overlay de uma oferta
│   └── card_oferta.tsx              # card visual reaproveitado
├── hooks/
│   ├── hook_ofertas_publicas.ts     # fetch affiliate_deals + categorias
│   └── hook_marca_ofertas.ts        # resolve marca via ?brandId/hostname
├── services/
│   └── servico_ofertas_publicas.ts  # queries supabase (anon)
├── types/
│   └── tipos_ofertas.ts
└── constants/
    └── constantes_ofertas.ts
```

## Roteamento

Em `src/App.tsx`:
- Adicionar `<Route path="/ofertas" element={<PaginaUbizOfertas />} />`
- Incluir `/ofertas` em `publicPaths`

Resolução da marca segue a regra padrão (`?brandId` > hostnames > `brand_domains`), reutilizando o helper já usado em `DriverPanelPage`.

## Toggle na Marca

Adicionar flag em `brand_settings_json`:
- `enable_ubiz_ofertas_mode: boolean`

Editor: incluir um switch no `BrandSettingsPage` (seção "Modos de entrada"), descrevendo: "Ativa a vitrine pública /ofertas sem pontuação".

Comportamento:
- Quando **desativado**: a rota `/ofertas` redireciona para `/auth` (ou Ubiz Resgata fallback) — mesma política do Universal Login.
- Quando **ativado**: rota acessível anonimamente.

A flag é resolvida no carregamento da página via `brand.brand_settings_json.enable_ubiz_ofertas_mode === true` (regra `=== true`, missing = OFF).

## Reuso e RLS

- Reaproveitar a query existente do Achadinhos (`affiliate_deals` com `is_active = true`, ordenado por `is_featured` + `order_index`) — **sem** filtros de `visible_driver` ou `is_redeemable`.
- Confirmar que `affiliate_deals` e `affiliate_deal_categories` possuem policy de leitura anônima por `brand_id` (já existe para o marketplace público — reutilizar). Se a policy atual exigir contexto de motorista, adicionar uma RLS análoga restrita a deals com a marca cuja flag `enable_ubiz_ofertas_mode = true` (validado por função SECURITY DEFINER).

## Visual

100% fiel ao `design_system.md` e idêntico ao Achadinhos público (cards, grids, cores), apenas removendo blocos de pontos. Tema da marca aplicado via `useBrandTheme` (cores, fonte, favicon, título).

## Fora de escopo

- Login / pontuação / resgate
- Migração de Achadinhos atual
- Painel admin de configuração de banners (usa o mesmo já existente)

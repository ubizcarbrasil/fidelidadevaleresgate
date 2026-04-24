# Corrigir painel cortado no mobile

## O problema

Ao abrir o painel administrativo no celular (rota `/`, "Visão Geral"), o conteúdo final (cards "Pontos Clientes", "Pontos Motoristas") fica **cortado na parte inferior** e não é possível rolar até o fim. A barra inferior do navegador mobile (e a barra de chat do preview) cobre a última parte da página.

## Causa raiz

Em `src/components/AppLayout.tsx`:

- O wrapper raiz usa `min-h-screen` (`100vh`).
- O `<main>` usa `flex-1 overflow-auto pwa-safe-bottom`.

No mobile (Safari/Chrome iOS/Android), `100vh` é calculado **ignorando** a barra de navegação inferior do navegador. Resultado: o container fica maior que a área visível e o `overflow-auto` interno “engole” a parte de baixo. A classe `pwa-safe-bottom` só funciona em PWA instalado — no navegador comum não adiciona padding.

A unidade correta para esse caso é `100dvh` (dynamic viewport height), que reage à barra do navegador mostrada/escondida.

## O que vamos mudar

Apenas ajustes de CSS/layout, sem alterar lógica de negócio. Mudanças escopadas para não impactar PWA instalado nem desktop.

### 1. `src/components/AppLayout.tsx`

- Trocar o wrapper raiz de `min-h-screen` para uma altura responsiva ao viewport dinâmico:
  - usar `min-h-[100dvh]` no `<div className="min-h-screen flex w-full">` (linhas 175 e 200).
- No `<main>` (linha 310): garantir que ele respeita a altura disponível e tem padding inferior extra no mobile, somando o safe-area:
  - adicionar classe utilitária `main-scroll-area` (definida no CSS) que aplica `padding-bottom: calc(env(safe-area-inset-bottom) + 24px)` em telas até 640px.
  - manter `overflow-auto` para a rolagem interna.

### 2. `src/index.css`

Adicionar regra única, isolada na seção mobile já existente (`@media (max-width: 640px)`):

```css
.main-scroll-area {
  /* Garante espaço extra abaixo no mobile para não ficar atrás da barra do navegador */
  padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 24px);
}

/* Wrapper full-height que respeita a barra do navegador mobile */
.app-shell-height {
  min-height: 100dvh;
}
```

E aplicar `app-shell-height` em substituição (ou em complemento) ao `min-h-screen` nos dois wrappers do `AppLayout` para fallback consistente.

### 3. Validação visual

- Desktop (≥1024): nenhum impacto — `100dvh` ≈ `100vh`.
- Mobile (375–430px): a última seção do painel passa a ser totalmente acessível por rolagem; nenhum corte.
- PWA standalone: continua respeitando `safe-area-inset-bottom` como antes.

## Arquivos editados

- `src/components/AppLayout.tsx` — substituir `min-h-screen` por classe utilitária e adicionar classe no `<main>`.
- `src/index.css` — adicionar `.app-shell-height` e `.main-scroll-area`.

## Fora de escopo

- Não alteramos o conteúdo do Dashboard.
- Não mexemos no wizard de produto nem no preview de sidebar.
- Não tocamos em `Dashboard.tsx`, sidebars ou rotas.

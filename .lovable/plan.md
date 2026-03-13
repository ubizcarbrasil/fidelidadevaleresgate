
Objetivo
- Eliminar a sensação de “voltou para versão antiga” e tornar o comportamento previsível entre painel administrativo, preview do app do cliente e app publicado.

Diagnóstico já confirmado
- O código novo está presente (ex.: `CustomerStoreDetailPage` com avaliações/horário, `StoreProfileTab` com editor de horário, migração `20260313000802...` criada).
- A coluna/tabela no backend também existem (`stores.operating_hours_json`, `store_reviews`).
- Na sua sessão atual, o app está em `/index` (painel), e não houve requisição para `/customer-preview` — isso explica parecer “outra versão”.

Plano de implementação
1) Tornar o contexto visível na UI (anti-confusão)
- Adicionar um indicador fixo de contexto:
  - “Painel Admin”
  - “Preview Cliente (marca X)”
  - “Publicado”
- Exibir também `brandId`/marca efetiva quando houver impersonação.

2) Corrigir navegação para preservar contexto
- Substituir navegações com `window.location.href = "/"` por navegação que preserve query params relevantes (`brandId`).
- Garantir que botões “Voltar ao Painel” e atalhos não removam contexto sem intenção explícita.

3) Fortalecer entrada no preview do cliente
- Ao abrir “App do Cliente”, sempre usar URL completa com `?brandId=...` quando aplicável.
- Se usuário estiver no painel com marca ativa e entrar em rota ambígua (`/`/`/index`), oferecer CTA claro para “Abrir Preview Cliente desta marca”.

4) Sinalizar diferença entre ambiente de teste e publicado
- Mostrar aviso curto: mudanças de frontend só aparecem no app publicado após atualizar publicação.
- Incluir link rápido para abrir preview e publicado lado a lado.

5) Checklist de validação ponta a ponta
- Fluxo ROOT impersonando marca:
  - Dashboard → App do Cliente → Oferta → Loja (com avaliações/horário).
- Fluxo brand_admin e store_admin.
- Validar em viewport mobile (430x761) e desktop.
- Confirmar que novas marcas/empreendedores seguem o mesmo fluxo sem hardcode.

Critérios de aceite
- Usuário sempre sabe em qual “modo” está (painel vs preview cliente vs publicado).
- Não ocorre perda silenciosa de `brandId` ao navegar.
- Abertura de oferta → página da loja funciona e exibe blocos novos quando dados existirem.
- Não há mais percepção de “rollback” ao trocar de rota/ambiente.

Detalhes técnicos
- Arquivos principais alvo:
  - `src/components/AppLayout.tsx` (voltar/preservar contexto)
  - `src/pages/CustomerPreviewPage.tsx` (entrada previsível do preview)
  - `src/pages/Dashboard.tsx` e `src/pages/AccessHubPage.tsx` (links consistentes)
  - `src/App.tsx` (mensagens/contexto de rota)
- Observação de dados:
  - Hoje há `0` lojas com `operating_hours_json` preenchido; por isso “Horário” só aparece após configurar no perfil da loja.

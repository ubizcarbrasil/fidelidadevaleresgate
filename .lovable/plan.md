# Tornar o módulo Ubiz Ofertas acessível

Hoje a configuração da vitrine pública `/ofertas` existe apenas escondida dentro do editor de tema da marca (`Marca → Aparência → Modos de entrada`). O usuário não consegue encontrá-la. Vamos expor o módulo em dois lugares de fácil acesso.

## 1. Nova página dedicada no menu Achadinhos

Criar a feature `src/features/ubiz_ofertas_admin/` com:

- `pagina_admin_ubiz_ofertas.tsx` — tela completa de configuração contendo:
  - Toggle "Ativar vitrine pública Ubiz Ofertas" (`enable_ubiz_ofertas_mode`)
  - Campo "Título da vitrine" (`ubiz_ofertas_title`)
  - Bloco `ControleAcessoOfertas` (público / autenticado / whitelist)
  - Bloco `LinkPublicoOfertas` (Copiar / Abrir / Compartilhar) com o aviso de "Publicar"
  - Card explicativo: "As ofertas exibidas são as mesmas cadastradas em **Achadinhos → Ofertas Afiliadas**" com botão atalho para `/affiliate-deals`
  - Estado vazio claro quando o toggle estiver desligado
- `components/secao_configuracao_ofertas.tsx` — extrai e reaproveita o bloco hoje embutido no `BrandThemeEditor.tsx` (linhas 445-492) para evitar duplicação. O `BrandThemeEditor` passa a importar este componente.
- `hooks/hook_configuracao_ubiz_ofertas.ts` — leitura/escrita do `brand_settings_json` (campos `enable_ubiz_ofertas_mode`, `ubiz_ofertas_title`, `ubiz_ofertas_access_mode`, `ubiz_ofertas_whitelist`).

### Registro na sidebar

- `src/compartilhados/constants/constantes_menu_sidebar.ts`: adicionar entrada
  ```
  "sidebar.ubiz_ofertas": {
    key: "sidebar.ubiz_ofertas",
    defaultTitle: "Ubiz Ofertas (Vitrine Pública)",
    url: "/ubiz-ofertas-admin",
    icon: Globe,
    moduleKey: "affiliate_deals",
  }
  ```
- `src/compartilhados/constants/constantes_grupos_sidebar_marca.ts`: incluir `"sidebar.ubiz_ofertas"` no grupo **Achadinhos** (logo após `sidebar.achadinhos`).
- `src/App.tsx`: registrar a rota `/ubiz-ofertas-admin` dentro do bloco protegido (com `ModuleGuard moduleKey="affiliate_deals"`), reaproveitando o lazy import já existente do padrão `lazyWithRetry`.

## 2. Card no Dashboard

- `src/pages/Dashboard.tsx`: adicionar `CardUbizOfertasDashboard` (novo, em `src/features/ubiz_ofertas_admin/components/`) que:
  - Aparece somente quando `enable_ubiz_ofertas_mode === true` no `brand_settings_json` da marca atual
  - Mostra título "Vitrine Pública Ubiz Ofertas", o link público pronto, e botões **Copiar**, **Abrir**, **Compartilhar** e **Configurar** (atalho para `/ubiz-ofertas-admin`)
  - Quando estiver desativado, mostra uma versão "call to action" simples ("Ative sua vitrine pública de ofertas") com botão para a página de configuração — visível apenas para administradores da marca

## 3. Resumo dos arquivos

**Novos:**
- `src/features/ubiz_ofertas_admin/pagina_admin_ubiz_ofertas.tsx`
- `src/features/ubiz_ofertas_admin/components/secao_configuracao_ofertas.tsx`
- `src/features/ubiz_ofertas_admin/components/card_ubiz_ofertas_dashboard.tsx`
- `src/features/ubiz_ofertas_admin/hooks/hook_configuracao_ubiz_ofertas.ts`

**Editados:**
- `src/App.tsx` (rota nova)
- `src/compartilhados/constants/constantes_menu_sidebar.ts` (entrada nova)
- `src/compartilhados/constants/constantes_grupos_sidebar_marca.ts` (grupo Achadinhos)
- `src/components/BrandThemeEditor.tsx` (substitui bloco inline pelo componente compartilhado)
- `src/pages/Dashboard.tsx` (insere card)

## Observação importante

A rota pública `/ofertas` no domínio `app.valeresgate.com.br` só funcionará após **clicar em Publicar** no editor (o build atual ainda não contém essa rota). O aviso amarelo já existente em `LinkPublicoOfertas` continuará informando isso.

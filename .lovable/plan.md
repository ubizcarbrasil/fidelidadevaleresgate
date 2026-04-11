
Diagnóstico objetivo

O problema não é que o link da Lovable “sumiu”. O comportamento atual do código faz o sistema priorizar o domínio canônico da marca quando ele existe. Então, depois que você cadastra um domínio próprio, parte dos links públicos deixa de permanecer no endereço `*.lovable.app` e passa a forçar redirecionamento para o domínio configurado.

O que está acontecendo no seu projeto

1. O painel do motorista tem redirecionamento automático
- Em `src/pages/DriverPanelPage.tsx`, se existir uma origem canônica da marca, a página compara a origem atual com a origem canônica e faz `window.location.replace(...)`.
- Hoje a lógica considera como canônica, nesta ordem:
  1. `brand_settings_json.driver_public_base_url`
  2. domínio principal em `brand_domains`
  3. URL publicada da Lovable
- Resultado: ao abrir `/driver?brandId=...` pela URL da Lovable, ele pode redirecionar para o domínio próprio. É isso que explica o loop / troca de domínio / dificuldade de abrir pelo link lovable.

2. A tela de configuração do painel do motorista monta o link com base na URL configurada
- Em `src/pages/DriverPanelConfigPage.tsx`, o botão “Abrir Painel do Motorista” usa:
  - `driver_public_base_url || window.location.origin`
- Se você preencheu domínio próprio ali, esse botão já deixa de apontar para a URL lovable.

3. Os links úteis do dashboard abrem em nova aba
- Em `src/components/dashboard/DashboardQuickLinks.tsx`, os botões “Abrir” usam `window.open(..., "_blank")`.
- Em mobile/webview isso pode:
  - perder a sessão
  - abrir fora do contexto atual
  - parecer que o link “não funciona”
- Para links administrativos isso piora bastante.

4. O app do cliente sem sessão pode falhar na lookup da marca
- Em `src/pages/CustomerPreviewPage.tsx`, o bloco `BrandThemedAuth` ainda consulta `brands` diretamente.
- Se a nova aba perder a sessão, essa consulta pode falhar por RLS e mostrar “Marca não encontrada”.
- Ou seja: além do redirecionamento de domínio, existe também um problema de abertura em nova aba.

Como resolver

Vou corrigir em 4 frentes:

1. Permitir acesso pelo domínio da Lovable sem forçar saída para o domínio próprio
- Ajustar `src/pages/DriverPanelPage.tsx` para não redirecionar automaticamente quando o acesso vier da URL publicada da Lovable.
- O redirecionamento ficará mais inteligente:
  - continua útil para domínio errado real
  - mas não bloqueia o acesso via link oficial da Lovable

2. Parar de abrir links internos em nova aba no dashboard
- Ajustar `src/components/dashboard/DashboardQuickLinks.tsx`
- Links administrativos e internos devem abrir na mesma aba para preservar sessão.
- Links públicos podem continuar copiáveis, mas a abertura precisa respeitar contexto mobile/webview.

3. Corrigir o botão “Abrir Painel do Motorista”
- Ajustar `src/pages/DriverPanelConfigPage.tsx`
- O botão deve usar a origem pública resolvida de forma consistente, sem depender cegamente de `window.location.origin` e sem induzir loop.
- Também vou separar melhor:
  - link compartilhável público
  - abertura local segura no admin

4. Corrigir o customer preview sem sessão
- Ajustar `src/pages/CustomerPreviewPage.tsx`
- Trocar a busca de marca do `BrandThemedAuth` para `public_brands_safe`, para funcionar mesmo sem sessão autenticada.

Resultado esperado após a correção

- Você conseguirá abrir as páginas públicas também pelo link da Lovable
- O domínio próprio continuará existindo e funcionando
- O sistema deixará de te “expulsar” da URL lovable quando isso não for necessário
- Os links do dashboard deixarão de parecer quebrados no mobile
- O painel do motorista não deve mais entrar em loop

Arquivos envolvidos
- `src/pages/DriverPanelPage.tsx`
- `src/pages/DriverPanelConfigPage.tsx`
- `src/components/dashboard/DashboardQuickLinks.tsx`
- `src/pages/CustomerPreviewPage.tsx`

Detalhe técnico
A causa principal é de governança de URL, não de publicação nem de rota SPA. Seu projeto está tratando o domínio próprio como obrigatório/canônico para alguns fluxos públicos. Eu vou ajustar para que o domínio da Lovable continue sendo uma rota de acesso válida, em vez de ser sempre sobrescrito pelo domínio personalizado.

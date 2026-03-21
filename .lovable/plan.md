
Objetivo: transformar o Achadinhos em um PWA “instalável” com ícone configurável pela marca e corrigir de vez o acesso público para que os links compartilhados não caiam na tela do Lovable/login.

1. Corrigir a URL pública real do Achadinhos
- Problema atual: os links públicos são gerados com `window.location.origin`, então no admin/preview/copiar link eles acabam usando domínio Lovable/preview em vez do domínio publicado da marca.
- Hoje isso acontece em:
  - `src/components/driver/DriverMarketplace.tsx`
  - `src/components/driver/DriverCategoryPage.tsx`
  - `src/components/customer/AchadinhoDealDetail.tsx`
  - `src/components/customer/AchadinhoCategoryPage.tsx`
  - `src/components/customer/AchadinhoDealsOverlay.tsx`
  - `src/pages/DriverPanelConfigPage.tsx`
  - `src/pages/Dashboard.tsx`
- Vou centralizar a geração da URL pública usando o domínio primário da marca em `brand_domains` quando existir.
- Regra:
  - se a marca tiver domínio/subdomínio primário configurado, usar `https://<dominio>/driver?...`
  - se não tiver, cair no origin atual como fallback
- Também vou ajustar os botões “copiar/abrir” da dashboard e da tela de configuração do motorista para usarem essa mesma URL pública.

2. Garantir que `/driver` continue realmente público
- O bypass em `src/App.tsx` já existe, então a rota pública já está liberada.
- O problema restante não é o roteamento em si, e sim o domínio errado sendo compartilhado.
- Vou manter essa arquitetura e alinhar todos os pontos de entrada para sempre apontarem para a URL pública correta da marca.

3. Transformar o Achadinhos em PWA da marca
- A base PWA já existe no projeto (`vite.config.ts`, `manifest`, `meta tags` e comportamento dinâmico em `src/hooks/useBrandTheme.ts`).
- Hoje o PWA dinâmico já tenta usar `theme.logo_url` como ícone.
- Vou ajustar para que o PWA do Achadinhos use explicitamente um campo configurável de ícone da marca, sem depender só da logo principal.
- Estrutura planejada:
  - novo campo no tema/configuração da marca, por exemplo `pwa_icon_url`
  - fallback para `logo_url` se o campo específico não existir
  - atualizar:
    - manifest dinâmico
    - `apple-touch-icon`
    - favicon, se fizer sentido manter alinhado
    - nome do app instalado (`display_name` ou nome específico do marketplace, se configurado)

4. Criar local de configuração para o ícone do PWA
- Melhor lugar: editor visual da marca, porque ali já existe bloco de “Logo” e “Favicon”.
- Arquivo principal:
  - `src/components/BrandThemeEditor.tsx`
- Vou adicionar um novo campo de upload, por exemplo:
  - “Ícone do app instalado (PWA)”
  - recomendação visual: PNG quadrado, 512x512
- Persistência:
  - salvar no tema da marca dentro de `brand_settings_json.theme`
- Isso permite que você troque a imagem que aparece no app instalado sem afetar necessariamente a logo usada no cabeçalho.

5. Ajustar o hook que monta o PWA dinâmico
- Arquivo:
  - `src/hooks/useBrandTheme.ts`
- Mudanças planejadas:
  - priorizar `theme.pwa_icon_url`
  - fallback para `theme.logo_url`
  - manter `display_name` e cores da marca no manifest
  - garantir `icons` com 192x192, 512x512 e `maskable`
- Também vou revisar o `start_url` para garantir que o app instalado abra no fluxo certo do Achadinhos público, em vez da home administrativa.
- Proposta:
  - usar `/driver?brandId=...` quando estivermos no contexto público do Achadinhos
  - ou manter `/` apenas se isso não puder ser definido com segurança no manifest dinâmico global
- Na implementação, vou escolher a opção mais estável sem quebrar o restante do app.

6. Evitar confusão entre PWA do admin e PWA do Achadinhos
- Como o projeto inteiro já tem PWA global, o ponto crítico é fazer o manifest dinâmico refletir a marca certa quando o usuário estiver no contexto do Achadinhos.
- Vou revisar se o tema está sendo aplicado no `/driver`; hoje `DriverPanelPage` lê `brand_settings_json.theme`, mas não há evidência de que o hook de manifest dinâmico esteja sendo executado nesse fluxo público.
- Se necessário, vou adicionar a aplicação explícita do tema/PWA também no fluxo do motorista para que:
  - nome do app instalado
  - ícone
  - cor do tema
  funcionem no Achadinhos público, não só no app do cliente.

7. Melhoria opcional já acoplada ao problema do compartilhar
- Como `navigator.share` falha em vários cenários, vou incluir fallback consistente:
  - se não houver share nativo, copiar o link público correto
  - mostrar feedback visual (“link copiado”)
- Isso evita a sensação de que “não está funcionando”.

Arquivos que devem entrar na implementação
- `src/components/BrandThemeEditor.tsx`
- `src/hooks/useBrandTheme.ts`
- `src/components/driver/DriverMarketplace.tsx`
- `src/components/driver/DriverCategoryPage.tsx`
- `src/components/customer/AchadinhoDealDetail.tsx`
- `src/components/customer/AchadinhoCategoryPage.tsx`
- `src/components/customer/AchadinhoDealsOverlay.tsx`
- `src/pages/DriverPanelConfigPage.tsx`
- `src/pages/Dashboard.tsx`

Resultado esperado
- O Achadinhos passa a ser instalável como PWA com ícone configurado pela marca
- Você terá um campo claro no admin para definir essa imagem
- Os links compartilhados e links copiados passarão a abrir a vitrine pública do motorista, sem login
- O link não vai mais cair numa página do Lovable por causa de `origin` incorreto, desde que a marca tenha um domínio público primário configurado

Detalhe importante encontrado na análise
- Na base atual, não encontrei registro de `brand_domains` para o domínio publicado que você mencionou, e os pontos de compartilhamento ainda dependem de `window.location.origin`.
- Então a correção precisa atuar em dois níveis:
  1. código para gerar a URL pública certa
  2. conferência/uso do domínio primário da marca já cadastrado no backend
- Se o domínio primário ainda não estiver salvo para essa marca, o código continuará tendo que cair em fallback. Por isso a implementação vai priorizar esse lookup corretamente.

Resumo técnico
```text
Admin marca
  -> configura pwa_icon_url
  -> configura domínio primário da marca

Hook de tema/PWA
  -> gera manifest dinâmico com pwa_icon_url
  -> atualiza apple-touch-icon / nome / cores

Compartilhamento Achadinhos
  -> usa URL pública derivada do domínio primário
  -> abre /driver?brandId=...&categoryId=... ou &dealId=...
  -> fallback para copiar link
```

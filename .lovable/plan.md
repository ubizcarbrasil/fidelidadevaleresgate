

## Plano: Ícone PWA configurável na página de configuração do Achadinhos + OG dinâmico

### Situação atual

- O campo `pwa_icon_url` já existe no **Editor de Tema da marca** (`BrandThemeEditor`), mas fica escondido entre muitas opções de tema
- O `useBrandTheme` já aplica o ícone PWA dinâmicamente no `/driver`
- **Porém**: na tela de configuração do Achadinhos (`DriverPanelConfigPage`) esse campo não aparece — o usuário não sabe onde configurar
- O **preview de link** (OG image/title) ao compartilhar mostra "Vale Resgate — Painel Admin" porque os meta tags são estáticos no `index.html` e crawlers não executam JavaScript

### O que vou implementar

**1. Adicionar campo de ícone PWA na config do Achadinhos** (`DriverPanelConfigPage`)
- Novo card "Identidade do App Instalável (PWA)" com upload de imagem
- Salva em `brand_settings_json.theme.pwa_icon_url`
- Recomendação visual: PNG quadrado 512×512
- Preview do ícone atual

**2. Atualizar meta tags OG dinamicamente no `/driver`** (`DriverPanelPage`)
- Ao carregar a marca, atualizar `og:title`, `og:image`, `og:description` via JavaScript
- Usar `pwa_icon_url` ou `logo_url` como `og:image`
- Título: nome da marca + "Achadinhos"
- Limitação: crawlers de redes sociais (WhatsApp, Telegram) geralmente não executam JS, então o preview pode não mudar. Para resolver isso de verdade, seria necessário um edge function que sirva HTML com OG tags dinâmicos (mencionarei como melhoria futura)

**3. (Bônus) Edge function para OG dinâmico** — criar uma edge function que sirva HTML com meta tags corretas quando o user-agent for um crawler
- Isso garante que WhatsApp, Telegram, iMessage mostrem a imagem e título da marca
- Porém, isso requer proxy/redirect no nível de servidor que não é trivial no setup atual
- **Alternativa prática**: atualizar o `index.html` com meta tags genéricas melhores e instruir o usuário que o PWA instalado usará o ícone configurado

### Arquivos
- `src/pages/DriverPanelConfigPage.tsx` — adicionar card de upload do ícone PWA
- `src/pages/DriverPanelPage.tsx` — atualizar OG meta tags dinamicamente
- `index.html` — melhorar meta tags padrão (título e descrição mais genéricos)

### Resultado
- O ícone do PWA instalado será o que o admin configurar na tela do Achadinhos
- O admin terá acesso direto ao upload do ícone sem precisar ir ao Editor de Tema
- Meta tags OG serão atualizados via JS (funciona para alguns apps, não para todos os crawlers)


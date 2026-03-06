

## Criar página de Configurações Visuais do Sistema Matriz

### Contexto

Já existe a tabela `platform_config` com registros key/value JSON. Vamos usá-la para armazenar o tema visual da plataforma (key: `platform_theme`), reutilizando o componente `BrandThemeEditor` que já existe para marcas.

### Plano

**1. Criar a página `src/pages/PlatformThemePage.tsx`**
- Busca o registro `platform_config` onde `key = 'platform_theme'`
- Se não existir, inicializa com valores padrão (cores atuais do `index.css`)
- Renderiza o `BrandThemeEditor` existente para edição de cores, fontes, logo, favicon, slogan e textos
- Botão "Salvar" faz upsert no `platform_config` via Supabase
- Toast de confirmação ao salvar

**2. Registrar rota no `App.tsx`**
- Adicionar rota `/platform-theme` dentro do layout protegido

**3. Adicionar link no `RootSidebar.tsx`**
- No grupo "🎨 Identidade & Vitrine", adicionar item "Tema da Plataforma" com ícone `Settings2`

**4. Aplicar o tema na raiz (opcional mas recomendado)**
- No `AppLayout.tsx`, buscar o `platform_theme` do `platform_config` e aplicar via `useBrandTheme` para que o painel administrativo reflita as cores configuradas

### Arquivos modificados
| Arquivo | Ação |
|---|---|
| `src/pages/PlatformThemePage.tsx` | Criar |
| `src/App.tsx` | Adicionar rota lazy |
| `src/components/consoles/RootSidebar.tsx` | Adicionar item de menu |
| `src/components/AppLayout.tsx` | Aplicar tema da plataforma |

Nenhuma migração de banco necessária — a tabela `platform_config` já suporta o formato key/value JSON.


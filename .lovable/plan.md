

## Plan: Upload com Recorte, Galeria de Ícones, Central de Banners, Organização Admin e Nomes Configuráveis

Este plano cobre 5 frentes novas solicitadas.

---

### 1. Upload de Imagem com Recorte (Image Cropper)

**Problema**: Hoje o `ImageUploadField` só faz upload direto, sem recorte.

**Solução**:
- Criar componente `ImageCropDialog.tsx` usando a lib `react-image-crop` (ou implementação nativa com canvas)
- Ao selecionar arquivo, abrir modal com preview + crop area (aspect ratio configurável)
- Botão "Recortar e Salvar" gera o blob recortado via Canvas API e faz upload ao Storage
- Integrar no `ImageUploadField` existente -- após selecionar arquivo, abre o crop dialog antes de enviar
- Aplicar em todos os lugares que usam imagem: BrandSectionsManager, BrandThemeEditor, StoreProfileTab, etc.

**Arquivos**:
| Arquivo | Ação |
|---|---|
| `src/components/ImageCropDialog.tsx` | **Novo** - Modal de recorte com canvas |
| `src/components/ImageUploadField.tsx` | Integrar crop dialog antes do upload |

---

### 2. Galeria de Ícones

**DB Migration** - Nova tabela `icon_library`:
- `id uuid PK`
- `brand_id uuid` (nullable = ícones globais)
- `name text`
- `category text` (ex: "ações", "categorias", "social")
- `icon_type text` -- "lucide" (nativo) ou "custom"
- `lucide_name text` -- nome do ícone lucide (se nativo)
- `image_url text` -- URL da imagem (se custom)
- `color text`
- `is_active boolean DEFAULT true`
- `created_at timestamp`

**Componentes**:
| Arquivo | Ação |
|---|---|
| `src/pages/IconLibraryPage.tsx` | **Novo** - CRUD de ícones com preview, busca por nome, upload de ícones custom |
| `src/components/IconPickerDialog.tsx` | **Novo** - Seletor de ícone reutilizável (busca lucide + custom) |

---

### 3. Central de Gestão de Banners com Agendamento

**DB Migration** - Nova tabela `banner_schedules`:
- `id uuid PK`
- `brand_id uuid`
- `brand_section_id uuid` (nullable -- pode ser banner global)
- `image_url text`
- `title text`
- `link_url text`
- `link_type text` -- "external", "internal", "offer", "store"
- `link_target_id uuid` (nullable)
- `start_at timestamptz`
- `end_at timestamptz` (nullable)
- `is_active boolean DEFAULT true`
- `order_index integer DEFAULT 0`
- `created_at, updated_at`

**Componentes**:
| Arquivo | Ação |
|---|---|
| `src/pages/BannerManagerPage.tsx` | **Novo** - Central de banners: lista, agendamento, preview, vinculação a seções |

Funcionalidades:
- Criar banner com data de início/fim
- Vincular a uma seção específica ou como banner global
- Vincular a oferta agendada (link_type = "offer")
- Preview visual do banner
- Status automático baseado em datas (AGENDADO / ATIVO / EXPIRADO)

---

### 4. Organização do Admin por Fluxos + Descrições de Instrução

**Mudança nos Sidebars**: Reorganizar os menus laterais do admin em grupos semânticos com labels descritivos.

Exemplo de reorganização do `BrandSidebar`:
```
📊 Visão Geral
  - Dashboard
  
🎨 Identidade Visual
  - Tema & Marca
  - Domínios
  - Galeria de Ícones
  
📱 Vitrine do App
  - Seções da Home
  - Central de Banners
  - Nomes e Rótulos
  
🏪 Operações
  - Lojas
  - Branches
  - Aprovação de Lojas
  - Importar CSV
  
💰 Programa de Pontos
  - Regras de Pontos
  - Extrato de Pontos
  
👥 Usuários & Permissões
  - Usuários
  - Módulos
```

**Descrições de instrução**: Cada página admin terá um cabeçalho com título + descrição curta de como usar aquela funcionalidade. Criar componente `PageHeader.tsx` reutilizável com `title`, `description` e opcional `helpLink`.

**Arquivos**:
| Arquivo | Ação |
|---|---|
| `src/components/PageHeader.tsx` | **Novo** - Header com título + descrição instrucional |
| `src/components/consoles/BrandSidebar.tsx` | Reorganizar em SidebarGroups por fluxo |
| `src/components/consoles/RootSidebar.tsx` | Idem |
| `src/components/consoles/TenantSidebar.tsx` | Idem |
| Todas as páginas admin | Adicionar PageHeader com descrição |

---

### 5. Configuração de Nomes dos Menus (Admin + App)

**DB Migration** - Nova tabela `menu_labels`:
- `id uuid PK`
- `brand_id uuid`
- `context text` -- "admin" ou "customer_app"
- `key text` -- identificador do menu (ex: "sidebar.dashboard", "app.ofertas")
- `custom_label text`
- `created_at, updated_at`
- `UNIQUE(brand_id, context, key)`

**Componentes**:
| Arquivo | Ação |
|---|---|
| `src/pages/MenuLabelsPage.tsx` | **Novo** - Tabela editável com todos os rótulos de menu, separados por contexto (Admin / App) |
| `src/hooks/useMenuLabels.ts` | **Novo** - Hook que carrega labels custom e faz fallback para o padrão |

**Integração**:
- Sidebars usam `useMenuLabels("admin")` para buscar nomes custom
- `CustomerLayout` usa `useMenuLabels("customer_app")` para bottom nav e quick actions
- Cada label tem um `key` fixo e um `custom_label` editável

---

### Ordem de Implementação

1. **ImageCropDialog** + integrar no ImageUploadField
2. **DB migrations** (icon_library, banner_schedules, menu_labels)
3. **Galeria de Ícones** (IconLibraryPage + IconPickerDialog)
4. **Central de Banners** (BannerManagerPage)
5. **PageHeader** + reorganizar Sidebars por fluxo
6. **MenuLabelsPage** + useMenuLabels hook
7. Integrar labels nos sidebars e customer app

### Resumo de Migrações DB

```sql
-- 1. icon_library
CREATE TABLE public.icon_library (...)

-- 2. banner_schedules  
CREATE TABLE public.banner_schedules (...)

-- 3. menu_labels
CREATE TABLE public.menu_labels (...)
```

Todas com RLS: leitura pública para items ativos, gestão restrita a brand/tenant/root admins.


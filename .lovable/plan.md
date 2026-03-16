

## Plano: Padronizar nomes entre Root e Brand Sidebar

### Problema
Os nomes dos grupos e a organização dos itens são inconsistentes entre o painel Root e o painel do Empreendedor. Isso confunde o administrador que alterna entre os dois contextos.

### Comparação atual — Grupos

```text
ROOT SIDEBAR                    BRAND SIDEBAR                  AÇÃO
────────────────────            ──────────────────             ─────
Guias Inteligentes              Guias Inteligentes             ✅ OK
Módulos & Funcionalidades       (dentro de Equipe)             ⚠️  Mover
Organização                     (não existe)                   ✅ Root-only
Marca & Experiência             Personalização                 ❌ Renomear
Aprovações                      Aprovações                     ✅ OK
Gestão Comercial                Gestão Comercial               ⚠️  Reorganizar
Programa de Fidelidade          Programa de Fidelidade         ✅ OK
Cashback Inteligente            Cashback Inteligente           ✅ OK
Equipe & Acessos                Equipe & Acessos               ⚠️  Reorganizar
Inteligência de Clientes        Inteligência de Clientes       ⚠️  Reorganizar
Configurações Avançadas         Inteligência & Dados           ❌ Renomear
                                Vitrine Digital                ❌ Alinhar
                                Integrações & API              ❌ Alinhar
```

### Solução: Usar os MESMOS nomes de grupo em ambos os sidebars

Padronizar para **9 grupos comuns** (Brand usa um subconjunto do Root):

| Grupo Padronizado | Root | Brand |
|---|---|---|
| Guias Inteligentes | ✅ | ✅ |
| Organização | ✅ | ❌ (Root-only) |
| Personalização & Vitrine | ✅ | ✅ |
| Aprovações | ✅ | ✅ |
| Gestão Comercial | ✅ | ✅ |
| Programa de Fidelidade | ✅ | ✅ |
| Cashback Inteligente | ✅ | ✅ |
| Equipe & Acessos | ✅ | ✅ |
| Inteligência & Dados | ✅ | ✅ |
| Integrações & API | ✅ | ✅ |
| Configurações | ✅ (avançadas) | ✅ |

### Alterações

#### 1. `src/components/consoles/BrandSidebar.tsx`

- **"Personalização"** + **"Vitrine Digital"** → juntar em **"Personalização & Vitrine"**
  - Cidades, Aparência, Ícones, Landing Parceiros, Boas-Vindas, Links do Perfil, Layout de Ofertas, Editor de Páginas, Achadinhos, Categorias de Achadinhos, Mídia & Banners
- **"Inteligência & Dados"** (Relatórios + Configurações) → separar:
  - Relatórios vai para **"Inteligência & Dados"**
  - Configurações vai para novo grupo **"Configurações"**
- **"Inteligência de Clientes"** → renomear para **"Inteligência & Dados"** e mover CSV Import para Gestão Comercial
- Mover "Módulos" de "Equipe & Acessos" para **"Configurações"**
- Mover "Auditoria" de "Equipe & Acessos" para **"Inteligência & Dados"**

#### 2. `src/components/consoles/RootSidebar.tsx`

- **"Marca & Experiência"** → renomear para **"Personalização & Vitrine"**
- **"Configurações Avançadas"** → dividir em:
  - **"Inteligência & Dados"**: Relatórios, Taxonomia, Auditoria
  - **"Integrações & API"**: Machine, API Keys, API Docs, Lab Webhook
  - **"Configurações"**: Módulos root, Permissões, Seções, Templates, Feature Flags, Novidades, Starter Kit, Configurações, Assinatura, Perfil de Planos
- Mover "Importação de Dados" de "Gestão Comercial" para "Inteligência & Dados"
- **"Inteligência de Clientes"** → renomear para **"Inteligência & Dados"** e mesclar com itens acima

#### 3. Resultado final — ambos os sidebars com mesma estrutura

```text
GRUPO                      ROOT ITEMS                           BRAND ITEMS
─────                      ──────────                           ───────────
Guias Inteligentes         3 guias                              2 guias
Organização                Empresas, Marcas, Cidades...         (não aparece)
Módulos                    Gerenciar Módulos                    (não aparece)
Personalização & Vitrine   Ícones, Banners, Pages, Tour...      Ícones, Banners, Pages, Tour...
Aprovações                 4 itens                              4 itens
Gestão Comercial           Parceiros, Ofertas, Resgates...      Parceiros, Ofertas, Resgates...
Programa de Fidelidade     3 itens                              3 itens
Cashback Inteligente       4 itens                              3 itens
Equipe & Acessos           Usuários, Permissões                 Usuários, Permissões, Acessos
Inteligência & Dados       CRM, Relatórios, Auditoria, CSV      CRM, Relatórios, Auditoria, CSV
Integrações & API          API Keys, Docs, Machine, Lab          API Keys, Docs, Machine, Lab
Configurações              Flags, Templates, Tema, Assinatura   Módulos, Configurações
```

### Arquivos alterados
- `src/components/consoles/RootSidebar.tsx` — renomear grupos + reorganizar itens
- `src/components/consoles/BrandSidebar.tsx` — renomear grupos + reorganizar itens para espelhar Root

Nenhuma alteração de banco de dados necessária.


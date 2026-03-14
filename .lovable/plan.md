

# Plano: Atualizar RootSidebar para alinhar com BrandSidebar

## Problema
O `RootSidebar` está desatualizado em relação ao `BrandSidebar`, que é o padrão mais evoluído. Diferenças:
- Emojis nos rótulos de grupo (Root usa "📊 Visão Geral", Brand usa "Configure")
- Root não tem grupos colapsáveis (Brand usa `Collapsible`)
- Root não usa `useMenuLabels` nem `useSidebarBadges`
- Organização de itens diferente e nomenclatura inconsistente
- "Nova Empresa" deveria seguir terminologia padronizada

## Alterações em `src/components/consoles/RootSidebar.tsx`

### 1. Adotar o padrão do BrandSidebar
- Usar `CollapsibleGroup` idêntico ao do BrandSidebar
- Remover emojis dos labels de grupo
- Adicionar `useMenuLabels("admin")` e `useSidebarBadges()`
- Usar interface `MenuItem` com `key` + `defaultTitle` (igual ao Brand)

### 2. Reorganizar grupos para espelhar a estrutura do BrandSidebar + itens ROOT-only

```text
── Painel Principal (fixo no topo)
├─ Jornadas
│  ├─ Jornada Completa (ROOT-only)
│  ├─ Jornada do Empreendedor
│  └─ Jornada do Emissor
├─ Estrutura (ROOT-only)
│  ├─ Empresas
│  ├─ Marcas
│  ├─ Cidades
│  ├─ Clonar Cidade
│  ├─ Domínios
│  ├─ Provisionar Marca
│  └─ Central de Acessos
├─ Identidade & Vitrine
│  ├─ Galeria de Ícones
│  ├─ Central de Propagandas
│  ├─ Nomes e Rótulos
│  ├─ Construtor de Páginas
│  ├─ Tema da Plataforma
│  ├─ Tour de Boas-Vindas
│  └─ Links do Perfil
├─ Validação
│  ├─ Aprovação de Parceiros
│  ├─ Aprovar Regras
│  ├─ Solicitações de Emissor
│  └─ Catálogo
├─ Operação
│  ├─ Parceiros
│  ├─ Ofertas
│  ├─ Clientes
│  ├─ Resgates
│  ├─ Cupons
│  ├─ Importar Planilha
│  ├─ Achadinhos
│  ├─ Categorias Achadinhos
│  ├─ Enviar Notificação
│  ├─ Operador PDV
│  └─ Patrocinados
├─ Pontos
│  ├─ Pontuar
│  ├─ Regras de Pontos
│  └─ Extrato de Pontos
├─ Ganha-Ganha
│  ├─ Dashboard Consolidado
│  ├─ Configuração GG
│  ├─ Painel Financeiro GG
│  └─ Fechamento Mensal
├─ Usuários e Permissões
│  ├─ Usuários
│  ├─ Módulos da Marca
│  └─ Permissões por Empresa
├─ CRM Estratégico
│  └─ CRM Estratégico
├─ Plataforma (ROOT-only)
│  ├─ Funcionalidades
│  ├─ Permissões Globais
│  ├─ Seções da Home
│  ├─ Modelos de Home
│  ├─ Controle de Recursos
│  ├─ Atualizações
│  ├─ Auditoria
│  ├─ Relatórios
│  ├─ Taxonomia
│  ├─ Kit Inicial
│  └─ Teste Webhook
```

### 3. Nomenclatura corrigida
- "Nova Empresa" → "Provisionar Marca"
- Labels sem emoji
- Mesmas keys do `DEFAULT_LABELS` de `useMenuLabels` onde aplicável

### Arquivo modificado
- `src/components/consoles/RootSidebar.tsx` — reescrita completa mantendo a mesma estrutura de componente


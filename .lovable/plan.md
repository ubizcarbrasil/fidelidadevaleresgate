

## Plano: Reordenação drag & drop dos grupos do sidebar do empreendedor

### Objetivo
Permitir que o empreendedor reorganize a ordem dos grupos do sidebar através de uma interface drag & drop no painel administrativo.

### Onde guardar a configuração
No campo `brand_settings_json` da tabela `brands`, adicionar uma chave `sidebar_group_order` com um array de labels dos grupos na ordem desejada:

```json
{
  "sidebar_group_order": [
    "Gestão Comercial",
    "Programa de Fidelidade",
    "Achadinhos",
    "Guias Inteligentes",
    ...
  ]
}
```

### Alterações

| Arquivo | Ação |
|---------|------|
| `src/components/brand-modules/SidebarOrderEditor.tsx` | **Criar** — Componente com lista drag & drop (usando `@dnd-kit/core` + `@dnd-kit/sortable`) dos grupos do sidebar |
| `src/pages/BrandModulesPage.tsx` | Adicionar o `SidebarOrderEditor` na tela de Módulos (ao lado ou abaixo do HomeSectionOrderEditor) |
| `src/components/consoles/BrandSidebar.tsx` | Ler `sidebar_group_order` do brand e reordenar os `groups` antes de renderizar |
| `src/hooks/useBrandInfo.ts` | Expor `brandSettingsJson` para acesso ao campo de configuração (se não expõe já) |

### UI do componente

```text
┌─────────────────────────────────────────┐
│ 📋 Ordem do Menu Lateral                │
│                                         │
│  ☰ Gestão Comercial            [↕]     │
│  ☰ Programa de Fidelidade     [↕]     │
│  ☰ Achadinhos                  [↕]     │
│  ☰ Guias Inteligentes          [↕]     │
│  ☰ Personalização & Vitrine   [↕]     │
│  ☰ Cidades                     [↕]     │
│  ...                                    │
└─────────────────────────────────────────┘
```

Cada item é arrastável. Ao soltar, salva automaticamente no `brand_settings_json`.

### Lógica no BrandSidebar
1. Buscar `sidebar_group_order` das settings da marca
2. Se existir, reordenar o array `groups` para seguir a ordem salva
3. Grupos não listados vão para o final (fallback seguro)

### Dependência
- Instalar `@dnd-kit/core` e `@dnd-kit/sortable` (ou usar setas ↑/↓ como no HomeSectionOrderEditor para manter consistência e evitar nova dependência)

### Alternativa sem nova dependência
Usar o mesmo padrão de setas ↑/↓ do `HomeSectionOrderEditor`, mantendo consistência visual e sem instalar pacotes extras. Recomendo esta abordagem.


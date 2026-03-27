

## Plano: Adicionar seletor de audiência nas seções nativas

### Problema
As seções nativas (Banners, Categorias, Selecionado para Você, Compre e Pontue, Achadinhos) não possuem interface para configurar a audiência (Todos / Apenas Motoristas / Apenas Clientes). Só seções CMS têm essa opção via SectionEditor.

### Solução
Adicionar um botão de configuração (⚙️) em cada card de seção nativa no `PageSectionsEditor.tsx`, que abre um mini-dialog para escolher a audiência. Ao salvar, atualiza o `home_layout_json` da marca.

### Arquivo a editar
`src/components/page-builder-v2/PageSectionsEditor.tsx`

### Mudanças
1. Adicionar estado para controlar qual seção nativa está sendo editada (`editingNativeAudience`)
2. Adicionar botão ⚙️ ao lado do botão de olho em cada seção nativa
3. Criar um Dialog simples com um Select de audiência (Todos / Apenas Motoristas / Apenas Clientes)
4. Ao salvar, atualizar o array `nativeSections` com a nova audiência e persistir no `home_layout_json`

### Layout do dialog

```text
┌──────────────────────────────┐
│  Configurar: Banners         │
│                              │
│  Quem pode ver?              │
│  [▼ Todos                  ] │
│     • Todos                  │
│     • 🚗 Apenas Motoristas   │
│     • 👤 Apenas Clientes     │
│                              │
│           [Salvar]           │
└──────────────────────────────┘
```

### Detalhes técnicos
- Reutilizar a mesma função `handleSaveNativeLayout` já existente para persistir no banco
- O estado de audiência é salvo junto com `enabled` e `order` no array `native_sections` dentro de `home_layout_json`
- Nenhuma migração necessária — o campo `audience` já é suportado no tipo `NativeSectionConfig`


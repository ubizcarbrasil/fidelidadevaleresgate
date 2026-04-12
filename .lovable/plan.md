

## Plano: Controle de Modo Claro/Escuro por Cidade e por Tipo de Usuário

### Problema
Atualmente o modo escuro é fixo (dark por padrão no app do cliente, dark forçado no painel do motorista). O empreendedor não tem controle sobre qual modo cada tipo de usuário (motorista/cliente) pode usar em cada cidade.

### Solução
Adicionar configurações no `branch_settings_json` de cada cidade para controlar o tema padrão e a possibilidade de alternância, separado por motorista e cliente.

### Novas flags no `branch_settings_json`

```json
{
  "theme_customer_default": "dark",
  "theme_customer_allow_toggle": true,
  "theme_driver_default": "dark",
  "theme_driver_allow_toggle": false
}
```

### Alterações

| Arquivo | Ação |
|---------|------|
| `src/pages/BrandBranchForm.tsx` | Adicionar 4 novos campos (selects + switches) na seção de configuração da cidade |
| `src/components/customer/CustomerLayout.tsx` | Ler `theme_customer_default` e `theme_customer_allow_toggle` do branch para definir o tema inicial |
| `src/pages/customer/CustomerProfilePage.tsx` | Ocultar o toggle de dark mode quando `theme_customer_allow_toggle` é `false` |
| `src/pages/DriverPanelPage.tsx` | Ler `theme_driver_default` do branch e respeitar `theme_driver_allow_toggle` |

### Detalhes da UI no formulário de cidade

Nova seção "Aparência do App" com:

```text
┌─────────────────────────────────────────────┐
│ 🎨 Aparência do App                         │
│                                             │
│ Cliente                                     │
│   Tema padrão:  [Escuro ▾]                 │
│   Permitir alternar tema:  [ON]             │
│                                             │
│ Motorista                                   │
│   Tema padrão:  [Escuro ▾]                 │
│   Permitir alternar tema:  [OFF]            │
└─────────────────────────────────────────────┘
```

### Lógica no app do cliente
1. `CustomerLayout` busca as settings do branch selecionado
2. Se `theme_customer_default` = `"light"`, inicia em modo claro (a menos que o usuário já tenha escolhido manualmente)
3. Se `theme_customer_allow_toggle` = `false`, o `DarkModeToggle` no perfil fica oculto e o tema é forçado

### Lógica no painel do motorista
1. `DriverPanelPage` lê `theme_driver_default` do branch
2. Se `theme_driver_allow_toggle` = `false`, força o tema configurado sem opção de mudança
3. Se `true`, adiciona um toggle no painel (atualmente não existe)


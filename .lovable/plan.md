

## Plano: Renomear "Assinatura" para "Meu Plano" e controlar via módulos

### Problema
1. O item "sidebar.subscription" está exibindo a chave técnica em vez do nome legível
2. O item não tem `moduleKey`, então não pode ser controlado pelo ROOT via módulos — ficando sempre visível

### Alterações

#### 1. `src/components/consoles/BrandSidebar.tsx`
- Alterar o `defaultTitle` de `"Assinatura"` para `"Meu Plano"`
- Adicionar `moduleKey: "subscription"` ao item para que o ROOT possa ativar/desativar via painel de módulos
- Adicionar `"subscription"` à lista `BASIC_PLAN_HIDDEN_MODULES` para que fique desabilitado por padrão no plano básico

#### 2. Dados: inserir `module_definitions` para "subscription"
- Criar uma entrada na tabela `module_definitions` com key `"subscription"`, grupo `"settings"`, para que apareça na aba Módulos da marca
- Inserir `brand_modules` com `is_enabled = false` para marcas existentes (ROOT ativa quando quiser liberar)

### Resultado
- O menu mostrará "Meu Plano" quando ativo
- O ROOT controla a visibilidade via aba Módulos da marca
- Por padrão, fica oculto no plano básico


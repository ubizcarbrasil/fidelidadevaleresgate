

## Problema Identificado

A rota `/machine-integration` (Integração Mobilidade) está protegida com `RootGuard` no `App.tsx` (linha 222), o que significa que **somente root_admin** pode acessá-la. Porém, o `BrandSidebar` exibe esse item de menu para empreendedores (brand_admin) com o módulo `machine_integration` ativo — criando uma situação onde o menu aparece mas a página redireciona para `/`.

O mesmo ocorre com `/machine-webhook-test` (linha 223).

## Plano

1. **Trocar `RootGuard` por `ModuleGuard`** nas rotas de integração de mobilidade no `App.tsx`:
   - `/machine-integration`: de `RootGuard` para `ModuleGuard moduleKey="machine_integration"`
   - `/machine-webhook-test`: de `RootGuard` para `ModuleGuard moduleKey="machine_integration"`

   Isso permitirá que qualquer usuário com o módulo `machine_integration` ativo na marca acesse essas páginas, mantendo a proteção por módulo.

2. **Verificar o módulo `machine_integration`** no banco para confirmar que está ativo para a marca do usuário. Se não estiver, ativá-lo.

### Impacto
- Empreendedores com o módulo habilitado passarão a acessar a página normalmente
- Root admins continuam tendo acesso (pois o `ModuleGuard` permite passagem para escopo ROOT)
- Sem alteração visual ou de sidebar


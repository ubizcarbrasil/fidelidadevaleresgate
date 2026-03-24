

## Problema

A rota `/welcome-tour` está protegida por `RootGuard` no `App.tsx` (linha 212), permitindo acesso apenas a administradores ROOT. Porém, o `BrandSidebar` exibe o link "Boas-Vindas" para empreendedores (Brand Admin), que ao clicar são bloqueados.

## Solução

Trocar o guard de `RootGuard` para `ModuleGuard` com a chave `welcome_tour`, consistente com o que já está configurado no `BrandSidebar`.

## Alteração

**`src/App.tsx` — linha 212**
```
// DE:
<Route path="welcome-tour" element={<RootGuard><WelcomeTourConfigPage /></RootGuard>} />

// PARA:
<Route path="welcome-tour" element={<ModuleGuard moduleKey="welcome_tour"><WelcomeTourConfigPage /></ModuleGuard>} />
```

Apenas 1 linha alterada. Nenhuma outra mudança necessária.


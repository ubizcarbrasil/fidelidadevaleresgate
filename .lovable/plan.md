

## Plano: Filtrar módulos visíveis para o empreendedor

### Problema
Hoje o `BrandModulesPage` mostra **todos** os `module_definitions` do catálogo, independente de quem está logado. O empreendedor vê módulos que o ROOT nunca habilitou para ele — e pode até tentar ativá-los.

### Solução

**Arquivo:** `src/pages/BrandModulesPage.tsx`

Para o empreendedor (não-ROOT), filtrar o catálogo de módulos exibidos:
- Mostrar apenas os `module_definitions` que possuem um registro em `brand_modules` para a marca dele (ou seja, módulos que o ROOT alocou)
- O empreendedor pode ligar/desligar apenas esses módulos alocados
- Módulos `is_core` continuam sempre visíveis e com switch desabilitado
- O ROOT continua vendo o catálogo completo (comportamento atual)

**Lógica:**
```
Se ROOT → mostra todos os module_definitions (sem filtro)
Se Empreendedor → filtra definitions para mostrar apenas os que têm brand_modules row
```

Também ajustar o texto descritivo: para o empreendedor, trocar "Ative ou desative os módulos disponíveis para esta marca" por algo como "Gerencie as funcionalidades ativas do seu programa".




## Fazer o Driver Hub funcionar — Conectar ao sistema de módulos

### Problema
O Hub do Motorista verifica `brand_settings_json.driver_hub_enabled`, mas o painel admin usa a tabela `brand_modules` para ligar/desligar módulos. As duas coisas não estão conectadas — por isso o Hub nunca aparece.

### Solução
Alterar o `DriverPanelPage` para consultar `brand_modules` + `module_definitions` (onde `key = 'driver_hub'`) em vez de depender de `brand_settings_json.driver_hub_enabled`.

### Alteração

**Arquivo:** `src/pages/DriverPanelPage.tsx`

1. Adicionar uma query para verificar se o módulo `driver_hub` está habilitado para a marca:
   ```ts
   const { data: hubEnabled } = useQuery({
     queryKey: ["driver-hub-enabled", brand.id],
     queryFn: async () => {
       const { data } = await supabase
         .from("brand_modules")
         .select("is_enabled, module_definitions!inner(key)")
         .eq("brand_id", brand.id)
         .eq("module_definitions.key", "driver_hub")
         .maybeSingle();
       return data?.is_enabled ?? false;
     },
   });
   ```

2. Substituir `const driverHubEnabled = settings?.driver_hub_enabled === true;` por `const driverHubEnabled = hubEnabled === true;`

### Pré-requisito
O módulo `driver_hub` já foi inserido na tabela `module_definitions` na migração anterior. Após esta alteração, basta o empreendedor ativar o módulo na tela de **Módulos** do admin para o Hub aparecer no app do motorista.

### Arquivo alterado

| Arquivo | Mudança |
|---------|---------|
| `src/pages/DriverPanelPage.tsx` | Query `brand_modules` para verificar `driver_hub` |


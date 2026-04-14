

## Ativar o módulo "Home do Motorista" para Ubiz Resgata

### Problema
O módulo `driver_hub` está cadastrado em `module_definitions`, mas não existe registro em `brand_modules` para a marca Ubiz Resgata (`db15bd21-9137-4965-a0fb-540d8e8b26f1`). Por isso, a query no `DriverPanelPage` retorna `false` e o Hub nunca é exibido.

### Solução
Executar uma migração SQL que insere o registro em `brand_modules` com `is_enabled = true` para a marca Ubiz Resgata.

```sql
INSERT INTO public.brand_modules (brand_id, module_definition_id, is_enabled)
SELECT 
  'db15bd21-9137-4965-a0fb-540d8e8b26f1',
  id,
  true
FROM public.module_definitions
WHERE key = 'driver_hub'
ON CONFLICT DO NOTHING;
```

### Resultado
O Driver Hub aparecera imediatamente no app do motorista da Ubiz Resgata ao acessar o painel. O empreendedor podera desativar o módulo a qualquer momento pela tela de Módulos no admin.

### Arquivo alterado
Nenhum arquivo de codigo — apenas uma migração de banco de dados.


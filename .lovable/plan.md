

## Problema: Menu "Integração Mobilidade" não aparece + cidades não pontuam

### Causa raiz

Dois problemas independentes:

1. **Módulo desativado**: O módulo `machine_integration` está **desabilitado** para a marca Ubiz Resgata na tabela `brand_modules`. Como o sidebar filtra itens pelo `moduleKey`, todo o grupo "Integrações & API" (incluindo "Integração Mobilidade") fica invisível.

2. **Scoring model ausente**: Nenhuma cidade da Ubiz Resgata tem `scoring_model` definido no `branch_settings_json` (está `null`). Isso faz com que os filtros `scoringFilter: "DRIVER"` escondam itens adicionais como "Motoristas", "Venda de Pontos", etc.

3. **Auto-ativação inexistente**: Quando o empreendedor preenche credenciais de integração no formulário de criação de cidade, o sistema salva a integração mas **não ativa automaticamente** o módulo `machine_integration` nem define o `scoring_model`.

### Solução

**A) Auto-ativar módulo ao registrar integração**

No `BrandBranchForm.tsx`, após chamar `register-machine-webhook` com sucesso, verificar se o módulo `machine_integration` está ativo e ativá-lo caso não esteja.

**B) Auto-definir scoring_model ao criar integração**

Quando credenciais de integração são salvas na criação da cidade, definir `scoring_model = "DRIVER_ONLY"` (ou `"BOTH"` se já houver módulo de passageiro) no `branch_settings_json`.

**C) Corrigir dados atuais via migração**

Uma migração SQL para:
- Ativar `machine_integration` para Ubiz Resgata (`db15bd21-9137-4965-a0fb-540d8e8b26f1`)
- Definir `scoring_model = 'DRIVER_ONLY'` nas 4 cidades que têm integração ativa mas sem scoring model

### Arquivos afetados

1. **`src/pages/BrandBranchForm.tsx`** — Adicionar lógica de auto-ativação do módulo e scoring_model após registro de integração
2. **Nova migração SQL** — Corrigir dados existentes (ativar módulo + scoring model)

### Detalhes técnicos

```typescript
// Após register-machine-webhook com sucesso em BrandBranchForm.tsx:
// 1. Ativar módulo machine_integration se não estiver ativo
const { data: modDef } = await supabase
  .from("module_definitions").select("id").eq("key", "machine_integration").single();
if (modDef) {
  await supabase.from("brand_modules")
    .upsert({ brand_id, module_definition_id: modDef.id, is_enabled: true }, 
             { onConflict: "brand_id,module_definition_id" });
}

// 2. Definir scoring_model no branch_settings_json
```

```sql
-- Migração: corrigir dados existentes
-- Ativar machine_integration para Ubiz Resgata
UPDATE brand_modules SET is_enabled = true
WHERE brand_id = 'db15bd21-9137-4965-a0fb-540d8e8b26f1'
  AND module_definition_id = (SELECT id FROM module_definitions WHERE key = 'machine_integration');

-- Definir scoring_model nas cidades com integração ativa mas sem scoring_model
UPDATE branches SET branch_settings_json = 
  COALESCE(branch_settings_json, '{}'::jsonb) || '{"scoring_model": "DRIVER_ONLY"}'::jsonb
WHERE id IN (
  SELECT branch_id FROM machine_integrations 
  WHERE is_active = true AND brand_id = 'db15bd21-9137-4965-a0fb-540d8e8b26f1'
) AND (branch_settings_json->>'scoring_model') IS NULL;
```


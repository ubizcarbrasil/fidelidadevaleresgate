

# Alterar `notify-driver-points` para ler API key da tabela `machine_integrations`

## Resumo
Remover o uso do secret `TAXIMACHINE_MESSAGE_API_KEY` e buscar a `api_key` diretamente da tabela `machine_integrations` usando o `brand_id` do payload.

## Alteração (único arquivo: `notify-driver-points/index.ts`)

1. **Remover** linhas 23-27 (leitura do secret `TAXIMACHINE_MESSAGE_API_KEY` e validação)
2. **Adicionar** após a validação de campos obrigatórios (após linha 55), uma query:
   ```typescript
   const { data: integration } = await sb
     .from("machine_integrations")
     .select("api_key")
     .eq("brand_id", brand_id)
     .maybeSingle();

   if (!integration?.api_key) {
     logger.error("API key not found in machine_integrations", { brand_id });
     return json({ error: "API key not configured for brand" }, 500);
   }
   ```
3. **Substituir** na linha 105 `TAXIMACHINE_API_KEY` por `integration.api_key`

Nenhum outro arquivo será alterado.


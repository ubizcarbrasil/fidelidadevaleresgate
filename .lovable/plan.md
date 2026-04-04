

## Plano: Configurar integração de Mariana

### Diagnóstico atual
- **Mariana** (branch `96f90fb6`): `driver_points_enabled = false`, sem credenciais Matrix, webhook não registrado
- **Araxá** (referência): Matrix API Key `mch_api_qyFEYa1MF8mTpPawwKmkMyCF`, user `Fidelidade@ubiz.com`, pass `Fidelidade@11`

### Ações necessárias

**1. Migração SQL** — Atualizar `driver_points_enabled` e credenciais Matrix diretamente no banco:
```sql
UPDATE machine_integrations
SET driver_points_enabled = true,
    matrix_api_key = 'mch_api_qyFEYa1MF8mTpPawwKmkMyCF',
    matrix_basic_auth_user = 'Fidelidade@ubiz.com',
    matrix_basic_auth_password = 'Fidelidade@11'
WHERE id = 'eafa3339-1342-41cc-bdcc-b41c87ab188b';
```

**2. Registrar webhook** — Chamar a edge function `register-machine-webhook` via curl com as credenciais existentes de Mariana para tentar registrar o webhook na TaxiMachine automaticamente.

**3. Verificar regras de pontos** — Confirmar se existem `driver_points_rules` para o branch de Mariana. Se não existirem, criar regras padrão (mesma estrutura de Araxá).

**4. Verificar carteira** — Confirmar se existe `branch_points_wallet` para Mariana. Se não, criar com saldo inicial.

### Resultado esperado
Mariana passará a pontuar motoristas automaticamente a cada corrida finalizada recebida via webhook, usando as mesmas credenciais Matrix da rede.


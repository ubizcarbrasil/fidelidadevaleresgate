

## Remover registros duplicados da Ubiz Resgata

### Registros a remover

| Tabela | ID | slug | Motivo |
|---|---|---|---|
| `brands` | `46ca6f73-b385-4ac3-8313-b79ca8c2b35c` | `ubizresgata` | Duplicata sem branches, stores, offers ou domínios |
| `tenants` | `6274ade5-989b-4738-a8db-f7c356d06bbc` | `ubiz-resgataa` | Duplicata -- único vínculo é a brand acima |

### Verificação de segurança

Confirmado que a brand duplicada tem **0 branches, 0 stores, 0 offers, 0 domínios**. O tenant duplicado possui apenas essa brand como dependência. Nenhum dado será perdido.

### Execução

Duas operações DELETE via ferramenta de dados (não migração):

1. **Deletar a brand duplicada** -- `DELETE FROM brands WHERE id = '46ca6f73-...'`
2. **Deletar o tenant duplicado** -- `DELETE FROM tenants WHERE id = '6274ade5-...'`

A brand precisa ser deletada primeiro por causa da foreign key `brands.tenant_id → tenants.id`.

### Registros que permanecem (corretos)

- **Tenant**: `2432d756-...` (slug: `ubiz-resgata`)
- **Brand**: `effc4685-...` (slug: `ubiz-resgata`) -- com 2 branches, 20 stores, domínio configurado

Nenhuma alteração de código é necessária.


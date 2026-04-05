

## Atualizar credenciais Matrix para Olímpia

### Situação atual
- **Olímpia** (`branch_id: d54c665f...`) tem `api_key` configurado (`mch_api_3cJ7iryBUYPKKGQl0hUhyRPy`) mas **não tem** as credenciais Matrix (`matrix_api_key`, `matrix_basic_auth_user`, `matrix_basic_auth_password` estão todos NULL).
- As outras cidades da marca (São João da Boa Vista, Mariana) já possuem as credenciais Matrix padrão da marca.

### O que será feito
Atualizar a tabela `machine_integrations` para Olímpia com as mesmas credenciais Matrix da marca:

| Campo | Valor |
|---|---|
| `matrix_api_key` | `mch_api_qyFEYa1MF8mTpPawwKmkMyCF` |
| `matrix_basic_auth_user` | `Fidelidade@ubiz.com` |
| `matrix_basic_auth_password` | `Fidelidade@11` |

### Impacto
Com as credenciais Matrix, o sistema poderá:
- Buscar recibos via endpoint Recibo (fallback)
- Buscar detalhes do cliente (telefone, email, CPF) via API `/integracao/cliente`
- Buscar detalhes do motorista via API `/integracao/condutor`

### Execução
Uma única operação de UPDATE na tabela `machine_integrations` para o registro de Olímpia.


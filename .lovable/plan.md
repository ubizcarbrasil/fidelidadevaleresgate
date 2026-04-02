

# Corrigir Motoristas e Clientes mostrando zero no dashboard

## Diagnóstico

O usuário logado tem o papel `branch_operator` (scope "Operador do Ponto de Venda"). A RLS da tabela `customers` exige a permissão `customers.read`, mas o papel `branch_operator` só possui 3 permissões:
- `branches.read`
- `vouchers.read`
- `vouchers.redeem`

As queries de contagem (`useMetric`) retornam 0 porque a RLS bloqueia o SELECT. O mesmo acontece para `machine_rides`, `redemptions`, `offers`, `stores`, etc.

## Solução

Criar uma migration que adicione permissões de leitura ao papel `branch_operator` para todas as tabelas usadas nos KPIs do dashboard:

| Permissão | Tabela afetada |
|---|---|
| `customers.read` | Clientes e Motoristas |
| `machine_rides.read` | Corridas e Pontuação |
| `redemptions.read` | Resgates |
| `offers.read` | Ofertas ativas |
| `stores.read` | Lojas ativas |
| `affiliate_deals.read` | Achadinhos ativos |

Todas as permissões serão somente de leitura (SELECT). A RLS existente já filtra por `brand_id` / `branch_id`, garantindo que o operador veja apenas dados da sua marca/cidade.

## Arquivo

| Arquivo | Ação |
|---|---|
| DB migration | `INSERT INTO role_permissions` para associar permissões de leitura ao papel `branch_operator` |

Nenhum arquivo de código precisa ser alterado — o problema é exclusivamente de permissão no banco.




# Ativar módulo `achadinhos_motorista` para todas as marcas com motoristas

## Situação atual
- O módulo `achadinhos_motorista` (ID `8587af40-69b3-4021-a4fc-497202d87391`) existe em `module_definitions` mas não tem **nenhum** registro em `brand_modules`.
- Consequência: o grupo "Achadinhos Motorista" no sidebar do franqueado nunca aparece.

## Marcas afetadas (todas com motoristas ativos)

| Marca | brand_id |
|---|---|
| Ubiz Resgata | `db15bd21-9137-4965-a0fb-540d8e8b26f1` |
| Ubiz Car | `44df8653-2a7a-40d1-b717-c6b09a6f694f` |
| DomStore | `6880cc3a-4aab-43b1-a4fb-d5062b535f75` |
| Leo fideliza | `5912631f-2d9c-4a07-a7ab-fc38cee5ff7e` |
| Vini fideliza | `d33010b1-3b80-437c-9a08-5d07765532c0` |

## Ação
Inserir 5 registros em `brand_modules` com `is_enabled = true`, um para cada marca, apontando para o `module_definition_id` do `achadinhos_motorista`.

## Resultado esperado
- O sidebar do franqueado passa a exibir o grupo completo: Carteira, Regras, Motoristas, Produtos, Pedidos e Manuais.
- Nenhuma alteração de código ou migração necessária — é apenas inserção de dados.


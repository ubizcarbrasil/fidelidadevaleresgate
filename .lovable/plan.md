

## Problema

As **descriptions na tabela `permissions`** no banco de dados contêm termos em inglês:

| key | description (atual) |
|---|---|
| branches.create | "Criar **branches**" |
| branches.delete | "Excluir **branches**" |
| branches.read | "Visualizar **branches**" |
| branches.update | "Editar **branches**" |
| brands.create | "Criar **brands**" |
| brands.delete | "Excluir **brands**" |
| brands.read | "Visualizar **brands**" |
| brands.update | "Editar **brands**" |

O código tem uma lógica de detecção (`rawModulePattern`) que deveria pegar esses termos e usar o fallback traduzido, mas a tela ainda exibe as chaves técnicas brutas.

## Solução

Atualizar diretamente as `description` dessas 8 permissões no banco com os termos corretos em português:

```sql
UPDATE permissions SET description = 'Criar cidades' WHERE key = 'branches.create';
UPDATE permissions SET description = 'Excluir cidades' WHERE key = 'branches.delete';
UPDATE permissions SET description = 'Visualizar cidades' WHERE key = 'branches.read';
UPDATE permissions SET description = 'Editar cidades' WHERE key = 'branches.update';
UPDATE permissions SET description = 'Criar marcas' WHERE key = 'brands.create';
UPDATE permissions SET description = 'Excluir marcas' WHERE key = 'brands.delete';
UPDATE permissions SET description = 'Visualizar marcas' WHERE key = 'brands.read';
UPDATE permissions SET description = 'Editar marcas' WHERE key = 'brands.update';
```

Isso corrige o problema na raiz (dados no banco) sem depender de lógica de fallback no frontend.

### Arquivo alterado
- Migração SQL apenas (nenhum arquivo de código)


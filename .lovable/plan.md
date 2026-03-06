

## Problema

O formulário "Nova Cidade" tem 3 campos confusos:
1. **"Nome"** — é o nome interno da branch (ex: "Filial Centro")
2. **"Identificador"** — é o slug técnico (ex: "filial-centro"), usado em URLs
3. **"Cidade"** — é o campo de cidade geográfica

Para o modelo de negócio onde "Branch = Cidade", os campos "Nome" e "Cidade" são redundantes, e "Identificador" é um conceito técnico desnecessário para o empreendedor.

## Solução

Simplificar o formulário eliminando a redundância:

1. **Remover o campo "Nome"** separado — usar o valor de "Cidade" como nome da branch (preenchido automaticamente)
2. **Gerar o slug automaticamente** a partir de Cidade + UF (ex: "curitiba-pr") — remover o campo "Identificador" visível
3. **Manter os campos UF e Cidade como principais** no topo do formulário
4. O campo `name` será preenchido automaticamente com `"${cidade} - ${UF}"` e o `slug` com `"${cidade}-${uf}"` normalizado

### Comportamento
- Ao preencher UF + Cidade, `name` e `slug` são gerados automaticamente
- Em modo edição, os valores carregados do banco são mantidos
- Timezone e coordenadas continuam como estão

### Arquivo alterado
- `src/pages/BranchForm.tsx` — reorganizar campos, auto-gerar name/slug


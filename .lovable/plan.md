

# Configuração do Modelo de Negócio padrão no nível da Marca

## Objetivo
Permitir que o empreendedor defina o modelo de negócio padrão (Motorista, Cliente ou Ambos) nas configurações da marca. Esse valor será usado como padrão ao criar novas cidades.

## Situação atual
- O `scoring_model` existe apenas na tabela `branches` (por cidade)
- Ao criar uma cidade, o padrão é hardcoded como `"BOTH"` no formulário
- Não há campo equivalente no nível da marca

## Plano

### 1. Armazenar o modelo padrão em `brand_settings_json`
Usar o campo JSON existente na tabela `brands`, adicionando a chave `default_scoring_model` (valores: `BOTH`, `DRIVER_ONLY`, `PASSENGER_ONLY`). Sem necessidade de migração de banco.

### 2. Adicionar seletor no formulário da marca (`BrandForm.tsx`)
Na aba **Geral** (Root Admin) e na aba **Tema Visual** (Brand Admin), adicionar um card/seção "Modelo de Negócio Padrão" com RadioGroup de 3 opções:
- Motorista (DRIVER_ONLY)
- Cliente (PASSENGER_ONLY)  
- Ambos (BOTH)

Salvar dentro de `brand_settings_json.default_scoring_model`.

### 3. Usar o padrão da marca ao criar nova cidade (`BrandBranchForm.tsx`)
No formulário de criação de cidade, ao inicializar o estado `scoringModel`, buscar o valor de `brand_settings_json.default_scoring_model` da marca corrente. Se não existir, manter `"BOTH"` como fallback.

### Arquivos alterados
- `src/pages/BrandForm.tsx` — adicionar estado e UI para `default_scoring_model`
- `src/pages/BrandBranchForm.tsx` — ler o padrão da marca ao criar nova cidade

### Detalhes técnicos
- O valor é persistido como parte do JSON existente, sem schema change
- O formulário de cidade continua permitindo sobrescrever o modelo por cidade
- Compatibilidade total: marcas sem a chave continuam funcionando com fallback `BOTH`


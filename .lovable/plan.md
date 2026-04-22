

# Corrigir filtros da página de Motoristas

## Diagnóstico (3 bugs)

Investiguei a base de Ipatinga (4.256 motoristas) e os logs de rede da sessão. Os filtros estão quebrados por três motivos sobrepostos:

### Bug 1 — Busca por nome é tratada como busca por placa
Em `hook_listagem_motoristas.ts` (linha 48):
```ts
const buscaPareceComPlaca = /[a-zA-Z]/.test(termo) && termo.length >= 3;
```
Qualquer texto com letras e ≥ 3 caracteres é interpretado como **placa**. Buscar "Pedro" dispara `vehicle1_plate.ilike.%PEDRO%` em `driver_profiles` — confirmado nos logs: retornou `[]` e a tela ficou vazia.

Pior: na base de Ipatinga, **0 motoristas têm placa cadastrada** em `driver_profiles`. A heurística é 100% destrutiva.

### Bug 2 — Filtro de status quebra a listagem
A coluna `driver_profiles.registration_status` tem hoje em Ipatinga:
- `Ativo` → 311 motoristas
- `NULL` → 3.945 motoristas
- `Inativo` / `Bloqueado` → 0 motoristas

Selecionar **Ativo** mostra só 311 (parece "filtro funcionando" mas esconde 92% da base, que está com status `NULL`). Selecionar **Inativo** ou **Bloqueado** mostra **zero**.

A regra de negócio real do sistema é: **todo motorista cadastrado é ativo por padrão**; "Inativo" e "Bloqueado" não estão sendo usados na operação atual da cidade.

### Bug 3 — Filtros não compõem corretamente com paginação
Quando o filtro `customerIdsFiltrados` retorna mais de 1.000 IDs, o `.in('id', ...)` no Postgrest pode silenciosamente truncar; e o `count: exact` da query principal sempre vai dar 311 mesmo quando o usuário só quer "Todos status" + busca.

## Solução

### 1. Remover heurística destrutiva de placa
- Apagar `buscaPareceComPlaca`
- **Toda busca textual** vai sempre para `customers` (nome, cpf, telefone, e-mail) via `.or()`
- Busca por placa volta como **opcional explícito**: só é feita em `driver_profiles` se a busca tiver formato de placa Mercosul ou tradicional (regex `^[A-Z]{3}-?[0-9][A-Z0-9][0-9]{2}$` após normalização). Se não tiver formato de placa, **nem tenta** — evita o sequestro.

### 2. Corrigir filtro de Status
Tratar `NULL` como `ATIVO` (regra de negócio real):
- **ATIVO**: `registration_status IS NULL OR registration_status ILIKE 'Ativo'`
- **INATIVO**: `registration_status ILIKE 'Inativo'`
- **BLOQUEADO**: `registration_status ILIKE 'Bloqueado'`

Na prática: ao escolher "Ativo", o usuário verá os 4.256 motoristas (não 311). "Inativo"/"Bloqueado" mostrarão vazio quando não houver dados, com mensagem clara.

### 3. Robustez da composição de filtros
- Quando `customerIdsFiltrados` excede 1.000, particionar em chunks e fazer `Promise.all` de queries `.in()` — depois unir resultados na memória respeitando paginação.
- Garantir que `count: exact` reflete o total **após** todos os filtros aplicados (validar com `total === motoristas.length` quando última página).

### 4. Refinar a UX dos filtros
- **Placeholder atualizado**: "Buscar por nome, CPF, telefone ou e-mail..." (remove "placa" para não confundir, já que a base não usa)
- **Contador "X de Y"**: mostrar `311 de 4.256` quando há filtro ativo, em vez de só `311 motoristas`. Ajuda o usuário a entender o que está sendo escondido.
- **Botão "Limpar filtros"** ao lado do select de status quando `busca !== '' || status !== 'ALL'`, para reset rápido.

## Arquivos impactados

**Editado (2):**
- `src/features/gestao_motoristas/hooks/hook_listagem_motoristas.ts` — remove heurística de placa, corrige filtro de status com `NULL`, adiciona chunking para `.in()`, mesma correção replicada no service de exportação
- `src/features/gestao_motoristas/services/servico_exportacao_motoristas.ts` — aplica as mesmas regras corrigidas (status + busca) para que a exportação CSV continue consistente com a tela
- `src/features/gestao_motoristas/components/barra_busca_motoristas.tsx` — placeholder atualizado + botão "Limpar filtros"
- `src/pages/DriverManagementPage.tsx` — contador "X de Y" no badge

**Sem migration. Sem nova RPC. Sem mudança em RLS.**

## Resultado esperado

| Ação | Antes | Depois |
|---|---|---|
| Buscar "Pedro" | Lista vazia (sequestrada para placa) | Lista todos os motoristas com "Pedro" no nome |
| Filtro "Ativo" | 311 motoristas (esconde 92%) | 4.256 motoristas (NULL = ativo) |
| Filtro "Inativo" | 0 motoristas (sem aviso) | 0 motoristas (com mensagem clara) |
| Buscar "ABC1D23" | Funciona (era o único caso ok) | Funciona (regex de placa) |
| Buscar "031.555.444-22" | Funciona | Funciona |
| Limpar filtros | Tem que apagar tudo manualmente | Botão único reset |

## Risco e rollback

- **Zero impacto em escrita** (apenas leitura)
- Rollback trivial: reverter os 4 arquivos
- Sem efeito colateral em outras telas (`useListagemMotoristas` é exclusivo desta página)


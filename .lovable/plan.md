

# Corrigir exportação CSV de motoristas (baixa só 50 de 4.256)

## Problema

O botão **CSV** na tela `/motoristas` (cidade no console do empreendedor "Meu Mototáxi") exporta apenas a página atual da listagem — 50 motoristas — em vez de todos os 4.256.

**Causa raiz** (`src/pages/DriverManagementPage.tsx`, linhas 72-95): a função `handleExportCsv` itera sobre `motoristas`, que é o resultado paginado de `useListagemMotoristas` com `POR_PAGINA = 50`. Nada busca o restante.

```ts
const POR_PAGINA = 50;                   // ← limita a query
const motoristas = resultado?.motoristas; // ← só a página atual
const rows = motoristas.map(...)          // ← exporta só 50
```

## Solução

Criar um **fluxo de exportação dedicado** que busca todos os motoristas em lotes (chunks), respeitando exatamente os mesmos filtros aplicados na tela (busca, status, escopo de cidade), e gera o CSV com o conjunto completo.

### 1. Novo serviço — exportação paginada em lotes

**Arquivo novo**: `src/features/gestao_motoristas/services/servico_exportacao_motoristas.ts`

- Função `exportarTodosMotoristas({ brandId, branchId, isBranchScope, busca, statusFiltro, onProgresso })`
- Reaproveita a mesma lógica de filtros do `useListagemMotoristas` (pré-filtro por placa/status em `driver_profiles`, filtros em `customers`)
- Itera em **lotes de 1.000 registros** usando `.range(from, to)` até esgotar (`from >= count`)
- Em cada lote, faz o enriquecimento (`get_driver_ride_stats`, `branches`, `profiles`) igual ao hook atual
- Devolve o array completo `DriverRow[]`
- Callback `onProgresso(carregados, total)` para atualizar UI

### 2. Novo utilitário — geração do CSV

**Arquivo novo**: `src/features/gestao_motoristas/utils/utilitarios_export_motoristas.ts`

- Função `gerarCsvMotoristas(motoristas: DriverRow[]): Blob`
- Função `baixarCsvMotoristas(blob: Blob, nomeArquivo: string)`
- Mantém o mesmo cabeçalho atual (Nome, CPF, Telefone, Email, Saldo, Pontos Corridas, Tier, Pontuação Ativa)
- Acrescenta colunas úteis que já existem: **Cidade** (`branch_name`) e **Total Corridas** (`total_rides`)
- Escapa aspas e usa BOM UTF-8 (compatível com Excel)

### 3. Novo hook — orquestrar exportação com loading/progresso

**Arquivo novo**: `src/features/gestao_motoristas/hooks/hook_exportar_motoristas.ts`

- Hook `useExportarMotoristas()` retorna `{ exportar, exportando, progresso }`
- `progresso` = `{ atual: number, total: number } | null`
- Em caso de erro: `toast.error` com mensagem clara
- Em sucesso: `toast.success("X motoristas exportados")`

### 4. Integração na página

**Arquivo editado**: `src/pages/DriverManagementPage.tsx`

- Remover `handleExportCsv` inline (linhas 72-95)
- Trocar por `const { exportar, exportando, progresso } = useExportarMotoristas()`
- Botão CSV passa a:
  - Mostrar `Loader2` girando + "Exportando…" enquanto `exportando`
  - Mostrar "X / Y" quando há `progresso` (texto pequeno ao lado)
  - Disabled enquanto exporta (não enquanto `motoristas.length === 0`, para permitir exportar mesmo se a página atual estiver vazia por algum filtro mas o total for >0)
- Disabled real: `total === 0 || exportando`

### 5. Limites e segurança

- Limite máximo defensivo: **20.000 motoristas** por exportação (cobre o caso atual com folga). Se ultrapassar, `toast.warning` sugere refinar busca/cidade.
- Tamanho do lote: 1.000 (alinhado com o padrão do projeto para listagens grandes; mantém timeouts seguros)
- Sem alteração de banco — usa tabelas e RPC já existentes

## Arquivos impactados

**Criados (3):**
- `src/features/gestao_motoristas/services/servico_exportacao_motoristas.ts`
- `src/features/gestao_motoristas/utils/utilitarios_export_motoristas.ts`
- `src/features/gestao_motoristas/hooks/hook_exportar_motoristas.ts`

**Editado (1):**
- `src/pages/DriverManagementPage.tsx` (remove função inline + integra hook)

**Sem migration. Sem mudança em RPCs. Sem mudança no fluxo de importação** (que já funciona — limite de 5.000 linhas por upload).

## Resultado esperado

- Empreendedor clica em **CSV** → vê "Exportando 1.000 / 4.256…" → arquivo baixado com **todos os 4.256 motoristas** da cidade Ipatinga (ou do escopo aplicado)
- Filtros de busca, status e cidade continuam respeitados — exporta exatamente o que o filtro retornaria
- Performance: ~5 lotes × ~400ms = exportação em poucos segundos para 4-5 mil motoristas

## Risco e rollback

- **Zero impacto em escrita** — operação 100% leitura
- Rollback trivial: reverter `DriverManagementPage.tsx` para versão atual
- Sem efeito em outras telas (gestão de motoristas é a única que usa `useListagemMotoristas`)




# Sub-fase 6.6 — Sincronização Auto-Cadastro × Importação CSV

## Objetivo

Garantir que **fluxo atual da primeira corrida não muda** (motorista continua sendo criado automaticamente), mas que os dados subidos via CSV ficam **visíveis imediatamente** na ficha — sem duplicar registros, sem quebrar nada.

## Diagnóstico — o que falta

Já está construído: tabela `driver_profiles`, importação CSV em chunks, ficha em 6 abas, match por `external_id → CPF → telefone → nome`.

Faltam 3 ajustes finos:

| # | Gap | Impacto |
|---|---|---|
| 1 | Listagem `/motoristas` tem `.limit(100)` | Subindo 4 mil, só 100 aparecem. Os 3.900 ficam invisíveis até a primeira corrida. |
| 2 | `machine-webhook` quando cria customer (primeira corrida) **não cria `driver_profiles`** | Motorista que nunca foi importado fica com ficha vazia eternamente. |
| 3 | Quando CSV é re-importado depois da primeira corrida, `external_driver_id` no customer pode estar diferente do `external_id` do CSV | Pode criar duplicata em vez de atualizar. |

## O que vai ser construído

### 1. `machine-webhook` — auto-criar `driver_profiles` na primeira corrida

Logo após criar o `customer` (linha 650), inserir em `driver_profiles` com os campos disponíveis vindos da TaxiMachine API (`fetchDriverDetails`):

```typescript
await sb.from("driver_profiles").upsert({
  customer_id: created.id,
  brand_id: brandId,
  branch_id: resolveBranchId,
  external_id: driverId || null,
  // o que a API retornar:
  cnh_number: driverDetails.cnh ?? null,
  birth_date: driverDetails.birth_date ?? null,
  // ... veículo da corrida atual se vier no payload
  vehicle1_plate: driverDetails.vehicle_plate ?? null,
  vehicle1_model: driverDetails.vehicle_model ?? null,
  registration_status: 'Ativo',
  registered_at: new Date().toISOString(),
  imported_at: new Date().toISOString(),
}, { onConflict: 'customer_id' });
```

E quando o customer **já existe** mas o `driver_profile` ainda não, criar agora também (idempotente via `upsert onConflict`). Resto fica com `null` até a importação CSV preencher.

Importação CSV continua sobrescrevendo só os campos que vierem preenchidos (fluxo já implementado).

### 2. Listagem `/motoristas` — paginação real + busca

Refatorar `DriverManagementPage.tsx`:

- Trocar `.limit(100)` por **paginação server-side de 50/página**
- Barra de busca com debounce 300ms — busca por:
  - Nome (ilike)
  - CPF (digits)
  - Telefone (digits)
  - **Placa do veículo** (join com `driver_profiles.vehicle1_plate` / `vehicle2_plate`)
- Filtro existente por cidade mantido
- Novo filtro por status (Ativo / Inativo / Bloqueado — vindo de `driver_profiles.registration_status`)
- Contador total: "Exibindo 1-50 de 4.123 motoristas"
- Botões "Anterior / Próxima" + ir para página

Implementação:
- Query principal usa `.range(from, to)` e `.count: 'exact'`
- Busca por placa: subquery em `driver_profiles` retorna `customer_ids` que casam, depois `customers.in('id', ids)`
- Hook próprio `hook_listagem_motoristas.ts` em `src/features/gestao_motoristas/` (segue arquitetura feature-based do workspace)

### 3. Importação CSV — reforço de match por external_id

No `import-drivers-bulk` o match já está OK, mas adicionar safeguard:
- Se uma linha do CSV tem `external_id` E existe um customer com mesmo CPF mas `external_driver_id` diferente / nulo, **atualiza** o `external_driver_id` em vez de criar novo. Isso garante que CSV importado depois da primeira corrida costura os dois registros.

### 4. Indicador visual na ficha

No card "Pessoal" da aba Dados, badge sutil mostrando origem dos dados:
- 🟢 "Importado em DD/MM" — se `driver_profiles.imported_at` foi setado por CSV
- 🔵 "Auto-cadastrado pela 1ª corrida" — se `imported_at = registered_at` (heurística)
- ⚪ "Aguardando dados completos" — se `driver_profiles` quase vazio

Pequeno, canto superior direito do card.

### 5. Manual atualizado

Adicionar nota em `dados_manuais.ts → importacao-motoristas-csv`:
- "Subir CSV antes da primeira corrida = motorista visível imediatamente"
- "Subir CSV depois da primeira corrida = enriquece registro existente sem duplicar"
- "Auto-cadastro continua ativo: motoristas novos sem CSV são criados na primeira corrida com dados básicos"

## Arquivos a editar/criar

| Arquivo | Ação |
|---|---|
| `supabase/functions/machine-webhook/index.ts` | adicionar upsert em `driver_profiles` após criar customer (linhas ~650) |
| `supabase/functions/import-drivers-bulk/index.ts` | reforçar match: atualizar `external_driver_id` quando CPF casa mas ext_id difere |
| `src/features/gestao_motoristas/hooks/hook_listagem_motoristas.ts` | **novo** — paginação + busca server-side |
| `src/features/gestao_motoristas/components/barra_busca_motoristas.tsx` | **novo** — input + filtros |
| `src/features/gestao_motoristas/components/paginacao_motoristas.tsx` | **novo** |
| `src/pages/DriverManagementPage.tsx` | usar novo hook, remover `.limit(100)`, plugar busca/paginação |
| `src/components/driver-management/tabs/AbaDadosMotorista.tsx` | adicionar badge de origem no card Pessoal |
| `src/components/manuais/dados_manuais.ts` | atualizar entrada existente |

## Detalhes técnicos

- **Não interfere no fluxo atual**: `machine-webhook` continua criando customer da mesma forma; `driver_profiles` é só um INSERT extra idempotente (`upsert onConflict: customer_id`). Se falhar, log de aviso e segue (não quebra a corrida).
- **Performance**: busca por placa usa índice já criado em `driver_profiles.vehicle1_plate` (verificar; se faltar, criar via migração).
- **RLS**: `driver_profiles` já tem RLS isolado por brand/branch (sub-fase anterior). Webhook usa service role, então não bloqueia.
- **Idempotência**: re-importar CSV → continua só "atualizado". Primeira corrida em motorista já importado → casa por `external_id` ou CPF, atualiza customer + reforça `driver_profiles.last_activity_at`.
- **Tipagem forte**: novos hooks 100% tipados, sem `any`.
- **Compat 100%**: motoristas atuais sem `driver_profiles` ganham um (vazio) na próxima corrida; ficha continua exibindo `—` nos campos vazios.

## O que NÃO entra
- Sincronização proativa de todos os motoristas ativos com a TaxiMachine API (chamada periódica) — sub-fase 6.7+
- Edição manual dos campos do `driver_profiles` na ficha — fase futura
- Export reverso (motoristas → CSV) — fase futura

## Riscos e rollback
- **Risco baixo**: 1 INSERT a mais no webhook (com try/catch isolado) + paginação na listagem.
- **Rollback**: reverter os 8 arquivos. Banco intacto. Sem migração nova.

## Estimativa
~25 min. Commit atômico único. `npx tsc --noEmit` esperado limpo.


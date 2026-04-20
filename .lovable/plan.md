

# Importação CSV Robusta de Motoristas (4 mil+ linhas) + Ficha Detalhada

## Diagnóstico — 5 problemas encontrados

Olhando o seu CSV de exemplo (sistema TaxiMachine, 117 colunas) e o sistema atual:

| # | Problema atual | Impacto |
|---|---|---|
| 1 | **Limite de 100/1000 linhas** — busca de motoristas existentes usa `.limit(1000)`, então da linha 1001 em diante o sistema cria duplicado em vez de atualizar | crítico para 4 mil motoristas |
| 2 | **Loop sequencial** com 1 INSERT/UPDATE por linha = ~4000 round-trips → trava o navegador / dá timeout | crítico |
| 3 | **Só lê 4 campos** (nome, cpf, telefone, email). Ignora os outros 113 do seu CSV | dados ricos jogados fora |
| 4 | **Não suporta XLSX** — só `.csv`. Seu arquivo é `.xlsx` | precisa converter manualmente |
| 5 | **Ficha do motorista (Aba "Dados") só mostra 5 campos**: nome, CPF, telefone, email, tier | informação rasa |

## O que vai ser construído

### 1. Banco — nova tabela `driver_profiles` (1:1 com `customers`)

Para não inflar a tabela `customers` (compartilhada com clientes não-motoristas), criar tabela paralela só para campos de motorista do TaxiMachine:

```sql
CREATE TABLE driver_profiles (
  customer_id uuid PRIMARY KEY REFERENCES customers(id) ON DELETE CASCADE,
  brand_id uuid NOT NULL,
  branch_id uuid NOT NULL,

  -- Identificação pessoal
  external_id text,              -- "Id" da TaxiMachine (1898478)
  gender text,                   -- Masculino/Feminino
  birth_date date,
  mother_name text,

  -- CNH
  cnh_number text,
  cnh_expiration date,
  has_ear boolean,               -- inferido de "CNH/SEM/EAR"

  -- Avaliação operacional
  rating numeric(3,2),           -- 4.9
  acceptance_rate integer,       -- 72 (em %)
  acceptance_rate_updated_at timestamptz,

  -- Status cadastral
  registration_status text,      -- Ativo/Inativo
  registration_status_at timestamptz,
  registered_at timestamptz,
  blocked_until timestamptz,
  block_reason text,
  last_os_at timestamptz,
  last_activity_at timestamptz,

  -- Métodos de pagamento aceitos (JSONB com flags)
  accepted_payments jsonb,       -- {credito, debito, voucher, ticket, cartao_app, wappa, pix, picpay, whatsapp, faturado, carteira_creditos}

  -- Serviços oferecidos (JSONB)
  services_offered jsonb,        -- {animais, corrida_central, macaneta, ubiz_whatsapp, ubiz_frete, ubiz_guincho, ubiz_x, ubiz_x_identificado}

  -- Vínculo operacional
  link_type text,                -- "Motorista sem vínculo"
  relationship text,             -- "Auxiliar"

  -- Veículo principal (1)
  vehicle1_model text,
  vehicle1_year integer,
  vehicle1_color text,
  vehicle1_plate text,
  vehicle1_state text,
  vehicle1_city text,
  vehicle1_renavam text,
  vehicle1_own boolean,
  vehicle1_exercise_year integer,

  -- Veículo secundário (2)
  vehicle2_model text,
  vehicle2_year integer,
  vehicle2_color text,
  vehicle2_plate text,
  vehicle2_state text,
  vehicle2_city text,
  vehicle2_renavam text,
  vehicle2_own boolean,
  vehicle2_exercise_year integer,

  -- Endereço
  address_street text,
  address_number text,
  address_complement text,
  address_neighborhood text,
  address_city text,
  address_state text,
  address_zipcode text,

  -- Dados bancários
  bank_holder_cpf text,
  bank_holder_name text,
  bank_code text,
  bank_agency text,
  bank_account text,
  pix_key text,

  -- Observações livres
  extra_data text,
  internal_note_1 text,
  internal_note_2 text,
  internal_note_3 text,

  -- Equipamento
  imei_1 text,
  imei_2 text,
  vtr text,
  app_version text,

  -- Indicação
  referred_by text,

  -- Taxas (JSONB para 30+ campos de faixas) — opcional, só importa se preenchido
  fees_json jsonb,

  -- Audit
  raw_import_json jsonb,         -- snapshot da linha original do CSV (para auditoria)
  imported_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

RLS isolado por `brand_id`/`branch_id` igual ao `customers`. Trigger para sincronizar `branch_id` quando o motorista for transferido.

### 2. Edge Function `import-drivers-bulk`

Move o trabalho pesado pro servidor:

- Recebe CSV/XLSX parseado em JSON do front (até 5 mil linhas)
- Processa em **chunks de 500** (padrão da plataforma)
- Para cada chunk:
  - Busca motoristas existentes da marca em **uma query** (CPFs + telefones + nomes normalizados via array)
  - Match por: CPF (preferencial) → telefone → nome → `external_id`
  - **UPSERT em lote**: `customers` (insert ou update) + `driver_profiles` (insert ou update)
- Retorna resumo: criados, atualizados, ignorados, erros (com linha + motivo)
- Tempo estimado: 4000 linhas em ~30-60s vs travamento atual

### 3. Front — modal de importação reformulado

`ImportarCsvMotoristas.tsx` reescrito como `ImportarMotoristas.tsx`:

| Etapa | UX |
|---|---|
| **Upload** | Aceita `.csv` **e** `.xlsx` (parser SheetJS já no projeto via `xlsx`) |
| **Preview** | Tabela mostrando primeiras 10 linhas com colunas detectadas + total de linhas |
| **Mapeamento** | Auto-detecta cabeçalhos do TaxiMachine (heurística por nome). Mostra "117 colunas detectadas, 95 mapeadas" + tabela colapsável "Colunas ignoradas" |
| **Confirmação** | Aviso: "Vai processar X linhas. Campos vazios não sobrescrevem dados existentes." |
| **Progresso** | Barra de progresso real (chunks processados / total) com WebSocket simples via polling |
| **Resultado** | Cards: criados / atualizados / ignorados / erros + scroll com lista detalhada + botão "Baixar CSV de erros" |

### 4. Ficha do motorista — 6 abas em vez de 4

`DriverDetailSheet.tsx` ganha 2 abas novas, e `AbaDadosMotorista` é dividida em sub-cards:

```text
┌─── Tabs ───────────────────────────────────────────────┐
│ Dados │ Veículos │ Documentação │ Pontos │ Regras │ Extrato │
└────────────────────────────────────────────────────────┘
```

**Aba "Dados"** (reformulada, 4 cards):
- **Pessoal**: nome, CPF, sexo, data nascimento, nome da mãe
- **Contato**: telefone, e-mail, endereço completo
- **Operacional**: status cadastral, vínculo, função, avaliação ★, taxa aceitação %
- **Bancário**: banco, agência, conta, chave PIX, titular

**Aba "Veículos"** (nova): cards para Veículo 1 e Veículo 2 (modelo, ano, placa, cor, RENAVAM, próprio?, UF/cidade emplacamento)

**Aba "Documentação"** (nova): CNH, vencimento CNH (com badge vermelho se vencida), EAR sim/não, IMEI 1/2, VTR, versão app, indicado por, observações internas (1, 2, 3 colapsáveis), histórico de importação (timestamp da última importação)

**Cada campo vazio é exibido com `—`** e em cinza claro — nunca quebra layout, nunca polui.

### 5. Manual atualizado

Adicionar entrada `importacao-motoristas-csv` em `dados_manuais.ts` documentando:
- Formato suportado (CSV / XLSX)
- Quais cabeçalhos são reconhecidos automaticamente
- Regra: campo vazio no CSV = não sobrescreve banco
- Limite de 5 mil linhas por importação
- Como interpretar "criados / atualizados / erros"

## Arquivos a editar/criar

| Arquivo | Ação |
|---|---|
| `supabase/migrations/<nova>.sql` | Criar tabela `driver_profiles` + RLS + índices |
| `supabase/functions/import-drivers-bulk/index.ts` | **nova** Edge Function |
| `src/features/importacao_motoristas/types/tipos_importacao.ts` | **novo** — tipagem de linhas + mapeamento |
| `src/features/importacao_motoristas/utils/mapeador_taximachine.ts` | **novo** — heurística de detecção de cabeçalhos |
| `src/features/importacao_motoristas/utils/parser_planilha.ts` | **novo** — parse CSV+XLSX usando `xlsx` |
| `src/features/importacao_motoristas/components/modal_importar_motoristas.tsx` | **novo** — substitui `ImportarCsvMotoristas.tsx` |
| `src/features/importacao_motoristas/components/etapa_upload.tsx` | **novo** |
| `src/features/importacao_motoristas/components/etapa_preview.tsx` | **novo** |
| `src/features/importacao_motoristas/components/etapa_progresso.tsx` | **novo** |
| `src/features/importacao_motoristas/components/etapa_resultado.tsx` | **novo** |
| `src/features/importacao_motoristas/hooks/hook_importar_motoristas.ts` | **novo** |
| `src/components/driver-management/ImportarCsvMotoristas.tsx` | **DELETAR** (substituído) |
| `src/pages/DriverManagementPage.tsx` | trocar import para o novo modal |
| `src/components/driver-management/DriverDetailSheet.tsx` | adicionar 2 abas (Veículos, Documentação) |
| `src/components/driver-management/tabs/AbaDadosMotorista.tsx` | refatorar em 4 cards |
| `src/components/driver-management/tabs/AbaVeiculosMotorista.tsx` | **novo** |
| `src/components/driver-management/tabs/AbaDocumentacaoMotorista.tsx` | **novo** |
| `src/types/driver.ts` | estender `DriverRow` com `driver_profile?: DriverProfile` |
| `src/components/manuais/dados_manuais.ts` | adicionar entrada `importacao-motoristas-csv` |

## Detalhes técnicos

- **Permissões**: import só para Brand Admin e Branch Admin. Branch admin importa só para a própria cidade (forçado server-side).
- **Match anti-duplicação**: prioridade CPF > external_id > telefone > nome normalizado (sem acentos, lowercase). Se 2 matches diferentes, marca como erro.
- **Idempotência**: re-importar mesmo CSV = só "atualizados" sem duplicar.
- **Chunking servidor**: 500 linhas por chunk (padrão Edge Function da plataforma).
- **Progresso real**: front faz polling em tabela `driver_import_jobs` (status, processed, total, errors) — simpler que websocket.
- **Tipagem forte**: tipos completos em `tipos_importacao.ts`, sem `any`.
- **Compat 100%**: motoristas atuais sem `driver_profiles` continuam funcionando — todos os campos extras são opcionais.

## O que NÃO entra agora
- Edição manual dos campos do `driver_profiles` (Veículos/Documentação) na ficha — fase próxima (esta fase só **lê**, importação é a única forma de gravar)
- Sincronização automática contínua com TaxiMachine via API — fase 6.7+
- Re-importação seletiva (só motoristas X) — fase futura

## Riscos e rollback
- Tabela nova, sem migração destrutiva — risco zero pra dados existentes.
- **Rollback**: drop da tabela + reverter os 17 arquivos. CSV antigo continua funcionando (mantém fallback no front se a Edge falhar).
- Limite duro: 5000 linhas por importação (acima disso pede pra dividir).

## Confirmações antes de implementar

1. **Os 30+ campos de "Taxa App / Maçaneta / Conveniência / Seguro"** (Faixa 1/2/3) — você quer que apareçam na ficha ou só ficam armazenados em `fees_json` para uso futuro (relatórios/automações)?
2. **Permissão**: o **branch admin** (login da cidade) **deve poder importar**? Hoje a tela só restringe a leitura por filial — vou estender o mesmo isolamento à importação (importa só para a cidade dele) — confirma?


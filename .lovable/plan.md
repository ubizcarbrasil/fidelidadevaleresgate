

## Checkpoint manual da Fase 3 — execução assistida

### Estado já validado (read-only)

| Momento | branch | is_enabled | source |
|---|---|---|---|
| Antes do INSERT | Leme - SP | **true** | **brand** ✅ |
| Antes do INSERT | Olimpia - SP (controle) | **true** | **brand** ✅ |

Tabela `city_module_overrides` confirmada vazia (0 linhas — backfill cenário A íntegro).

### O que falta executar (precisa de modo default — DML)

Vou criar uma única migration de teste com 3 blocos atômicos, cada um seguido de SELECT capturado via `RAISE NOTICE`, e te entrego o relatório final.

**Migration de teste (transação única, com rollback automático no final):**

```sql
DO $$
DECLARE
  r record;
BEGIN
  -- PASSO 1.2: INSERT override OFF em Leme
  INSERT INTO city_module_overrides (brand_id, branch_id, module_definition_id, is_enabled)
  VALUES (
    'db15bd21-9137-4965-a0fb-540d8e8b26f1',
    '601882d7-bf11-4b49-afd1-728d54232ed3',
    'ea20135f-3fc9-4d29-8ddf-a90149cf917f',
    false
  );

  -- PASSO 1.3: leitura pós-INSERT (Leme)
  SELECT * INTO r FROM resolve_active_modules(
    'db15bd21-9137-4965-a0fb-540d8e8b26f1',
    '601882d7-bf11-4b49-afd1-728d54232ed3'
  ) WHERE module_key = 'sponsored';
  RAISE NOTICE 'TESTE 1 pos-INSERT (Leme): is_enabled=%, source=%', r.is_enabled, r.source;

  -- PASSO 2.2: leitura na outra branch (Olimpia)
  SELECT * INTO r FROM resolve_active_modules(
    'db15bd21-9137-4965-a0fb-540d8e8b26f1',
    'ece001ed-950e-4ae5-b59b-196952ae961f'
  ) WHERE module_key = 'sponsored';
  RAISE NOTICE 'TESTE 2 (Olimpia): is_enabled=%, source=%', r.is_enabled, r.source;

  -- PASSO 3.1: DELETE override
  DELETE FROM city_module_overrides
  WHERE branch_id = '601882d7-bf11-4b49-afd1-728d54232ed3'
    AND module_definition_id = 'ea20135f-3fc9-4d29-8ddf-a90149cf917f';

  -- PASSO 3.2: leitura pós-DELETE (Leme)
  SELECT * INTO r FROM resolve_active_modules(
    'db15bd21-9137-4965-a0fb-540d8e8b26f1',
    '601882d7-bf11-4b49-afd1-728d54232ed3'
  ) WHERE module_key = 'sponsored';
  RAISE NOTICE 'TESTE 3 pos-DELETE (Leme): is_enabled=%, source=%', r.is_enabled, r.source;
END $$;
```

### Critérios de aceite (avalio antes de te entregar)

| Teste | Esperado | Falha = |
|---|---|---|
| 1 (pós-INSERT Leme) | `is_enabled=false, source=branch` | qualquer outra coisa |
| 2 (Olimpia) | `is_enabled=true, source=brand` | qualquer outra coisa |
| 3 (pós-DELETE Leme) | `is_enabled=true, source=brand` | qualquer outra coisa |

Se algum falhar: paro imediatamente, mostro o `RAISE NOTICE` capturado e abro diagnóstico antes de qualquer correção. Não toco em código.

Se todos passarem: entrego a tabela final 4 linhas + status PASS/FAIL de cada teste + confirmação de que `city_module_overrides` voltou a 0 linhas (estado limpo pós-checkpoint).

### Observação sobre Realtime cross-tab

O teste de propagação visual (<2s, 2 abas abertas) você precisa fazer no navegador — eu não consigo abrir 2 abas autenticadas simultâneas. Após eu te entregar o relatório SQL, abra `/brand-modules` da Ubiz Resgata em 2 abas e dispare o INSERT manualmente via SQL Editor (vou te entregar o snippet pronto para isso).

**Aprova execução desta migration de teste?**




# Sub-fase 5.7 — Trigger de sincronização `brand_business_models → brand_modules`

## Resumo

Criar **1 função plpgsql** + **1 trigger** AFTER INSERT/UPDATE/DELETE em `brand_business_models` que mantém `brand_modules` sincronizado com a regra inteligente: liga REQUIRED ao ativar modelo, e só desliga REQUIRED ao desativar se nenhum outro modelo ativo da mesma brand precisar daquele módulo. Nunca toca OPTIONAL nem CORE. Atômico (transação do statement). Audit trail por evento.

## Respostas às 8 questões

### 1. SQL completo (apresentado em §4)

### 2. SECURITY DEFINER × RLS

- `brand_modules` tem RLS exigindo `user_has_permission('settings.update')` ou `root_admin`. Trigger executando no contexto do empreendedor falharia para usuários sem essa permission explícita (ex: ações de Edge Functions de provisionamento). Logo, **`SECURITY DEFINER` é obrigatório**.
- Mitigação de escopo:
  - Função declarada `SET search_path = public` (proteção contra schema hijack).
  - Função **só executa `INSERT/UPDATE` em `brand_modules`** filtrados por `NEW.brand_id`/`OLD.brand_id` — não há SQL dinâmico, não há leitura de input não-validado.
  - Função é `OWNER = postgres` (default em migrations Supabase) — escopo mínimo necessário.
  - Não aceita parâmetros do usuário (lê apenas `NEW`/`OLD`), eliminando risco de SQL injection.

### 3. Estratégia de audit logging: **1 linha por evento de trigger** (consolidado)

| Estratégia | Prós | Contras |
|---|---|---|
| **A: 1 linha consolidada por sync** ✅ | Audit limpo (1 evento de produto = 1 linha), `details_json` agrega contadores e lista de módulos afetados. Performance ótima. | Granularidade menor — para detalhar é preciso ler o JSON. |
| B: 1 linha por módulo alterado | Granularidade total | Polui `audit_logs` (ativar 1 modelo = 10 linhas), dificulta leitura humana, redundante (já temos audit do toggle do business_model na hook). |

**Escolha: A.** Estrutura:
```jsonb
{
  "trigger_op": "INSERT|UPDATE|DELETE",
  "business_model_id": "...",
  "business_model_key": "pontua_cliente",
  "is_enabled_old": false,
  "is_enabled_new": true,
  "modules_required": ["points","customers","wallet",...],
  "modules_enabled":  ["points","customers"],
  "modules_disabled": [],
  "modules_skipped_shared": ["wallet"],
  "modules_skipped_core":   ["home_sections"]
}
```
- `entity_type = 'sync_trigger'`
- `action = 'brand_modules_synced'`
- `actor_user_id = NULL` (trigger automático, sem ator humano direto — o ator real está no audit log do toggle que disparou)
- `scope_type = 'BRAND'`, `scope_id = brand_id`
- `entity_id = brand_id`

### 4. SQL completo (função + trigger + audit)

```sql
-- ============================================================
-- Sub-fase 5.7 — Trigger sync_brand_modules_from_business_models
-- ============================================================

CREATE OR REPLACE FUNCTION public.sync_brand_modules_from_business_models()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_brand_id           uuid;
  v_business_model_id  uuid;
  v_model_key          text;
  v_op                 text;
  v_old_enabled        boolean;
  v_new_enabled        boolean;
  v_should_enable      boolean := false;
  v_should_disable     boolean := false;

  v_required_modules   uuid[];
  v_enabled_keys       text[] := ARRAY[]::text[];
  v_disabled_keys      text[] := ARRAY[]::text[];
  v_skipped_shared     text[] := ARRAY[]::text[];
  v_skipped_core       text[] := ARRAY[]::text[];
  v_required_keys      text[] := ARRAY[]::text[];

  r record;
  v_other_uses_it      boolean;
BEGIN
  -- 1. Resolver contexto e operação
  IF TG_OP = 'DELETE' THEN
    v_brand_id          := OLD.brand_id;
    v_business_model_id := OLD.business_model_id;
    v_old_enabled       := OLD.is_enabled;
    v_new_enabled       := false;
    v_op                := 'DELETE';
  ELSE
    v_brand_id          := NEW.brand_id;
    v_business_model_id := NEW.business_model_id;
    v_new_enabled       := NEW.is_enabled;
    v_old_enabled       := COALESCE(OLD.is_enabled, false);  -- false em INSERT
    v_op                := TG_OP;
  END IF;

  -- 2. Decidir se há trabalho a fazer
  IF v_old_enabled = false AND v_new_enabled = true THEN
    v_should_enable := true;
  ELSIF v_old_enabled = true AND v_new_enabled = false THEN
    v_should_disable := true;
  ELSE
    -- INSERT com is_enabled=false, ou UPDATE sem mudar is_enabled (ex: margem GG)
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- 3. Buscar key do modelo (para audit)
  SELECT bm.key INTO v_model_key
  FROM business_models bm
  WHERE bm.id = v_business_model_id;

  -- 4. Buscar IDs e KEYs dos módulos REQUIRED do modelo
  SELECT array_agg(bmm.module_definition_id),
         array_agg(md.key)
    INTO v_required_modules, v_required_keys
  FROM business_model_modules bmm
  JOIN module_definitions md ON md.id = bmm.module_definition_id
  WHERE bmm.business_model_id = v_business_model_id
    AND bmm.is_required = true;

  IF v_required_modules IS NULL OR array_length(v_required_modules, 1) IS NULL THEN
    -- Modelo sem módulos REQUIRED — nada a fazer, mas registra audit "noop"
    INSERT INTO public.audit_logs (
      actor_user_id, entity_type, entity_id, action, scope_type, scope_id, details_json
    ) VALUES (
      NULL, 'sync_trigger', v_brand_id, 'brand_modules_synced', 'BRAND', v_brand_id,
      jsonb_build_object(
        'trigger_op', v_op,
        'business_model_id', v_business_model_id,
        'business_model_key', v_model_key,
        'is_enabled_old', v_old_enabled,
        'is_enabled_new', v_new_enabled,
        'modules_required', '[]'::jsonb,
        'noop_reason', 'no_required_modules'
      )
    );
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- 5. CASE ENABLE: UPSERT cada módulo REQUIRED como is_enabled=true
  --    (exceto CORE — CORE deve ficar como está, geralmente já true)
  IF v_should_enable THEN
    FOR r IN
      SELECT md.id, md.key, md.is_core
      FROM module_definitions md
      WHERE md.id = ANY(v_required_modules)
    LOOP
      IF r.is_core THEN
        v_skipped_core := array_append(v_skipped_core, r.key);
        CONTINUE;
      END IF;

      INSERT INTO public.brand_modules (brand_id, module_definition_id, is_enabled)
      VALUES (v_brand_id, r.id, true)
      ON CONFLICT (brand_id, module_definition_id)
      DO UPDATE SET is_enabled = true, updated_at = now();

      v_enabled_keys := array_append(v_enabled_keys, r.key);
    END LOOP;

  -- 6. CASE DISABLE: para cada módulo REQUIRED do modelo desligado,
  --    verificar se outro modelo ATIVO da brand ainda o requer.
  ELSIF v_should_disable THEN
    FOR r IN
      SELECT md.id, md.key, md.is_core
      FROM module_definitions md
      WHERE md.id = ANY(v_required_modules)
    LOOP
      IF r.is_core THEN
        v_skipped_core := array_append(v_skipped_core, r.key);
        CONTINUE;
      END IF;

      SELECT EXISTS (
        SELECT 1
        FROM brand_business_models bbm
        JOIN business_model_modules bmm
          ON bmm.business_model_id = bbm.business_model_id
        WHERE bbm.brand_id = v_brand_id
          AND bbm.is_enabled = true
          AND bbm.business_model_id <> v_business_model_id
          AND bmm.module_definition_id = r.id
          AND bmm.is_required = true
      ) INTO v_other_uses_it;

      IF v_other_uses_it THEN
        v_skipped_shared := array_append(v_skipped_shared, r.key);
        CONTINUE;
      END IF;

      UPDATE public.brand_modules
         SET is_enabled = false, updated_at = now()
       WHERE brand_id = v_brand_id
         AND module_definition_id = r.id;

      v_disabled_keys := array_append(v_disabled_keys, r.key);
    END LOOP;
  END IF;

  -- 7. Audit log consolidado (1 linha por evento)
  INSERT INTO public.audit_logs (
    actor_user_id, entity_type, entity_id, action, scope_type, scope_id, details_json
  ) VALUES (
    NULL, 'sync_trigger', v_brand_id, 'brand_modules_synced', 'BRAND', v_brand_id,
    jsonb_build_object(
      'trigger_op', v_op,
      'business_model_id', v_business_model_id,
      'business_model_key', v_model_key,
      'is_enabled_old', v_old_enabled,
      'is_enabled_new', v_new_enabled,
      'modules_required', to_jsonb(v_required_keys),
      'modules_enabled',  to_jsonb(v_enabled_keys),
      'modules_disabled', to_jsonb(v_disabled_keys),
      'modules_skipped_shared', to_jsonb(v_skipped_shared),
      'modules_skipped_core',   to_jsonb(v_skipped_core)
    )
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_brand_modules_from_bbm ON public.brand_business_models;

CREATE TRIGGER trg_sync_brand_modules_from_bbm
AFTER INSERT OR UPDATE OR DELETE ON public.brand_business_models
FOR EACH ROW
EXECUTE FUNCTION public.sync_brand_modules_from_business_models();

-- ROLLBACK (se necessário — não destrói dados):
-- DROP TRIGGER IF EXISTS trg_sync_brand_modules_from_bbm ON public.brand_business_models;
-- DROP FUNCTION IF EXISTS public.sync_brand_modules_from_business_models();
```

### 5. Plano de rollback

```sql
DROP TRIGGER IF EXISTS trg_sync_brand_modules_from_bbm ON public.brand_business_models;
DROP FUNCTION IF EXISTS public.sync_brand_modules_from_business_models();
```
- **Sem efeitos colaterais nos dados**: `brand_modules` permanece exatamente no estado em que estava no momento do drop. Audit logs já gravados ficam (histórico imutável). Nenhum schema change para reverter.
- Se quiser desligar **temporariamente** sem dropar: `ALTER TABLE brand_business_models DISABLE TRIGGER trg_sync_brand_modules_from_bbm;`

### 6. Estimativa
- **Tempo de implementação:** ~10 min (1 migration + 9 testes SQL).
- **LOC:** ~150 linhas de SQL (função + trigger + comentários).
- **Performance esperada:** 1 SELECT (módulos required) + N UPSERT/UPDATE + 1 INSERT (audit). Para 10 módulos = ~12 statements simples = bem abaixo de 100ms.

### 7. Atomicidade — cenário de falha

- Trigger `AFTER ... FOR EACH ROW` executa **dentro da transação do statement original**. Se qualquer comando dentro da função falhar (ex: violação de FK, RLS error apesar do SECURITY DEFINER), **toda a transação faz rollback**: a alteração em `brand_business_models` também é desfeita. Garantia ACID.
- Não há risco de "modelo ligado mas módulos não sincronizados" — ou tudo passa, ou nada muda.
- Cliente JS recebe o erro e o React Query trata via `onError` do hook `useToggleBrandBusinessModel` (já implementado na 5.5).
- Único ponto de atenção: audit log também é parte da transação — se falhar, rollback. Aceitável (audit corrompido é pior que perder o evento).

### 8. Testes SQL pós-criação (executar no Supabase via read_query/migration de teste)

Ubiz Resgata `brand_id = db15bd21-9137-4965-a0fb-540d8e8b26f1`. Vou rodar os 9 testes em sequência. Snapshot de `brand_modules` antes/depois para diff.

```sql
-- Snapshot inicial
CREATE TEMP TABLE _snap0 AS
SELECT bm.key as module_key, bmd.is_enabled
FROM brand_modules bmd JOIN module_definitions bm ON bm.id = bmd.module_definition_id
WHERE bmd.brand_id = 'db15bd21-9137-4965-a0fb-540d8e8b26f1';

-- TESTE 1: Liga modelo "pontua_cliente" → módulos required ligam
INSERT INTO brand_business_models (brand_id, business_model_id, is_enabled)
SELECT 'db15bd21-...', id, true FROM business_models WHERE key='pontua_cliente'
ON CONFLICT (brand_id, business_model_id) DO UPDATE SET is_enabled=true;

-- Verificar diff em brand_modules + audit_logs
SELECT * FROM audit_logs WHERE entity_type='sync_trigger' ORDER BY created_at DESC LIMIT 1;

-- TESTE 2: Liga "ganha_ganha" (compartilha 'points', 'customers', 'wallet' com pontua_cliente)
INSERT INTO brand_business_models ... ganha_ganha ... is_enabled=true
-- Verificar: points/customers/wallet continuam ON; novos GG (gg_dashboard, multi_emitter) ligaram

-- TESTE 3: Desliga "pontua_cliente" → módulos compartilhados ficam, exclusivos desligam
UPDATE brand_business_models SET is_enabled=false WHERE business_model_id=(SELECT id FROM business_models WHERE key='pontua_cliente');
-- Verificar: points/customers/wallet PERMANECEM ON (ganha_ganha usa); points_rules/earn_points_store também (ganha_ganha usa)
-- audit details: skipped_shared deve listar esses

-- TESTE 4: Desliga "ganha_ganha" também → agora exclusivos vão embora
UPDATE brand_business_models SET is_enabled=false WHERE business_model_id=(SELECT id FROM business_models WHERE key='ganha_ganha');
-- Verificar: points/customers/wallet etc desligam (nenhum modelo ativo restante usa)

-- TESTE 5: Modelo com 'notifications' OPTIONAL → trigger não toca
-- Ligar achadinho_cliente (notifications é OPTIONAL nele)
-- Pré-set: UPDATE brand_modules SET is_enabled=false WHERE module='notifications'
-- Após ligar achadinho_cliente: notifications continua FALSE (não ligou)

-- TESTE 6: CORE não é tocado
-- Verificar: customers (is_core=true), wallet, stores, home_sections — listados em skipped_core no audit

-- TESTE 7: DELETE row
INSERT achadinho_motorista (true);
DELETE FROM brand_business_models WHERE business_model_id=(SELECT id FROM business_models WHERE key='achadinho_motorista');
-- Comportamento idêntico ao UPDATE→false

-- TESTE 8: Performance
EXPLAIN ANALYZE INSERT brand_business_models (ganha_ganha, true);  -- modelo com 12 módulos required
-- Esperado: <100ms

-- TESTE 9: Rollback documentado no comentário da migration
-- Snapshot final + DELETE de tudo que criamos pra restaurar estado pré-teste
```

**Limpeza pós-teste**: ao final, restauro `brand_modules` e `brand_business_models` ao snapshot inicial via DELETE/UPDATE explícitos para não deixar resíduo no banco do Ubiz Resgata.

## Arquivos

**Migration (1):**
- `supabase/migrations/<ts>_phase_57_sync_trigger.sql` — função + trigger + comentário de rollback

**Sem alterações de código TS** — trigger é puramente backend. Hooks da 5.5 e 5.6 já fazem as mutations corretas; o trigger é transparente para eles.

**Sem regeneração de types.ts** — não há nova tabela/coluna/função RPC pública (função é interna ao trigger).

## Riscos
- **Baixos**, condicionado a passar nos 9 testes:
  - Ambiente beta restrito a Ubiz Resgata. Outras brands não têm `brand_business_models` populado, então trigger nunca dispara para elas.
  - Rollback é 2 linhas SQL sem efeitos em dados.
  - Atomicidade garantida pela transação do statement.
- Único cuidado operacional: se algum dia for criada lógica que faz `UPDATE brand_business_models SET ganha_ganha_margin_pct=...` SEM mudar `is_enabled`, o trigger detecta (passo 2) e retorna sem trabalho — não há custo extra. Validado no teste 8 indireto.


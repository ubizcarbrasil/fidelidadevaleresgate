

## Log de Auditoria na Finalização de Duelos

### Objetivo
Registrar automaticamente, no momento da finalização, os ride counts calculados, os IDs das corridas contadas e o resultado, criando rastreabilidade completa para investigar divergências.

### Plano

**1. Criar tabela `driver_duel_audit_log` (migração)**

```sql
CREATE TABLE driver_duel_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  duel_id uuid REFERENCES driver_duels(id) ON DELETE CASCADE NOT NULL,
  challenger_customer_id uuid NOT NULL,
  challenged_customer_id uuid NOT NULL,
  challenger_rides_counted bigint NOT NULL,
  challenged_rides_counted bigint NOT NULL,
  challenger_ride_ids uuid[] DEFAULT '{}',
  challenged_ride_ids uuid[] DEFAULT '{}',
  winner_participant_id uuid,
  count_window_start timestamptz NOT NULL,
  count_window_end timestamptz NOT NULL,
  points_settled boolean DEFAULT false,
  finalized_by text DEFAULT 'cron',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE driver_duel_audit_log ENABLE ROW LEVEL SECURITY;

-- Admins can read
CREATE POLICY "Admins can read audit logs"
  ON driver_duel_audit_log FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('root_admin','brand_admin','branch_admin')
  ));
```

**2. Criar função auxiliar para coletar IDs das corridas**

Nova função `collect_duel_ride_ids` que retorna os UUIDs das corridas contadas numa janela, usada dentro do `finalize_duel`.

```sql
CREATE FUNCTION collect_duel_ride_ids(p_customer_id uuid, p_branch_id uuid, p_start_at timestamptz, p_end_at timestamptz)
RETURNS uuid[]
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT COALESCE(array_agg(id ORDER BY finalized_at), '{}')
  FROM machine_rides
  WHERE driver_customer_id = p_customer_id
    AND branch_id = p_branch_id
    AND ride_status = 'FINALIZED'
    AND finalized_at >= p_start_at
    AND finalized_at <= p_end_at;
$$;
```

**3. Atualizar `finalize_duel` RPC para gravar auditoria**

Adicionar, logo após calcular os ride counts e antes do UPDATE final, um INSERT na tabela de auditoria com:
- IDs das corridas (via `collect_duel_ride_ids`)
- Counts calculados
- Janela de tempo usada (`start_at`, `end_at`)
- Winner determinado
- Se pontos foram liquidados

**4. Exibir dados de auditoria no `DuelDetailSheet.tsx` (admin view)**

- Criar hook `useAuditoriaDuelo` em `hook_duelos.ts` que busca o registro de auditoria para um duel_id
- No detalhe do duelo finalizado, mostrar seção colapsável "Auditoria" com:
  - Timestamp da finalização
  - Contagem registrada vs armazenada (alerta se divergir)
  - Quantidade de ride IDs coletados
  - Janela de contagem (início/fim)

### Arquivos
- **Criar migração**: tabela `driver_duel_audit_log` + função `collect_duel_ride_ids` + atualizar `finalize_duel`
- **Editar**: `src/components/driver/duels/hook_duelos.ts` — hook `useAuditoriaDuelo`
- **Editar**: `src/components/driver/duels/DuelDetailSheet.tsx` — seção de auditoria para duelos finalizados


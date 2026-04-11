

## Plano: Agendar sincronização automática 3x ao dia (00:00, 12:00, 18:00)

### O que será feito
Configurar 3 jobs no pg_cron que chamam a edge function `mirror-sync` com `brand_id: "auto"` nos horários 00:00, 12:00 e 18:00. A edge function já suporta esse modo — ela busca todas as configs com `auto_sync_enabled = true` e sincroniza cada uma.

### Mudanças

**1. Habilitar extensões pg_cron e pg_net** (migração SQL)
```sql
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;
```

**2. Criar os 3 jobs agendados** (insert via supabase tool — contém dados específicos do projeto)
- Job 1: `0 0 * * *` (00:00 UTC)
- Job 2: `0 12 * * *` (12:00 UTC)  
- Job 3: `0 18 * * *` (18:00 UTC)

Cada job faz `net.http_post` para `/functions/v1/mirror-sync` com body `{"brand_id":"auto"}`.

**3. Atualizar UI de Config** (opcional, informativo)
- Adicionar texto na seção "Sincronização automática" informando os horários fixos: "Sincronização automática ocorre às 00:00, 12:00 e 18:00"

### Arquivos envolvidos
- 1 migração SQL (extensões)
- 1 insert SQL via supabase tool (cron jobs)
- `src/components/mirror-sync/MirrorSyncConfig.tsx` (texto informativo)

### Resultado
A sincronização roda automaticamente 3 vezes ao dia para todas as brands com auto_sync habilitado.




# Corrigir erro ao trocar formato para "Campeonato"

## Diagnóstico

Ao clicar em **Campeonato** no seletor de Formato de engajamento, a UI dispara o RPC `duelo_change_engagement_format`, que falha com:

```
op ANY/ALL (array) requires array on right side
```

**Causa raiz** — bug na função SQL `public.duelo_change_engagement_format` (criada em `20260422002423_…sql`, linha 147):

```sql
IF NOT (has_role(auth.uid(),'root_admin')
     OR (p_brand_id = ANY(get_user_brand_ids(auth.uid()))
         AND has_role(auth.uid(),'brand_admin'))) THEN
```

A função `public.get_user_brand_ids(uuid)` retorna `SETOF uuid` (um conjunto de linhas), não `uuid[]` (array). O operador `= ANY(...)` exige um **array** do lado direito. Como o que vem é um SET, o Postgres lança o erro acima e o usuário fica preso na tela.

Confirmado por inspeção:
- `pg_proc` mostra `get_user_brand_ids` com `returns SETOF uuid`
- Apenas **uma** função em todo o banco usa o padrão errado: `duelo_change_engagement_format` (verificado por `pg_proc.prosrc`)
- O fluxo de UI funciona (toast de erro genérico aparece corretamente), o servidor é o único ponto a corrigir

## Solução

Migration única que recria `public.duelo_change_engagement_format` trocando o trecho do `ANY(...)` por uma das duas formas válidas com `SETOF`:

```sql
-- Antes
p_brand_id = ANY(get_user_brand_ids(auth.uid()))

-- Depois (usar IN com subquery — idiomático para SETOF)
p_brand_id IN (SELECT public.get_user_brand_ids(auth.uid()))
```

Nada mais muda na função: mesmo nome, mesma assinatura, mesmas regras de negócio (validação de formato, bloqueio se houver temporada ativa, log em `duelo_attempts_log`, retorno JSON com `previous_format`/`new_format`/`changed_at`).

### Verificação pós-aplicação

1. Empreendedor abre **Painel → Campeonato → Formato de engajamento**
2. Toca em **Campeonato** → toast verde "Formato alterado com sucesso"
3. Card "Formato atual diferente de Campeonato" desaparece e aparece o painel de criação de temporada
4. Tentativa de troca com temporada ativa continua dando o erro de negócio correto ("Não é possível trocar formato com temporada ativa")

## Arquivos impactados

**Migration nova (1):**
- `supabase/migrations/<timestamp>_fix_duelo_change_engagement_format.sql` — recria a função com o `IN (SELECT ...)` corrigido

**Sem mudança em código TypeScript** — o hook `useTrocarFormatoEngajamento` e o serviço `trocarFormatoEngajamento` já estão corretos, só consomem o RPC.

## Risco e rollback

- **Risco zero**: a função é recriada via `CREATE OR REPLACE`, mantendo assinatura, permissões e dependentes intactos.
- Lógica de autorização permanece idêntica — só muda a sintaxe de comparação com a lista de marcas do usuário.
- **Rollback**: down trivial reaplicando o `CREATE OR REPLACE` antigo (preservado no histórico de migrations).


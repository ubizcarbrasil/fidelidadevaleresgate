

# Configurar a marca **Meu Mototáxi** apenas com Campeonato + corrigir fluxo travado

## Diagnóstico — por que o botão "Criar temporada" não aparece

A página `PaginaCampeonatoEmpreendedor` exige **3 camadas** OK em ordem:

1. **Camada 1** (Root) — `brand_settings_json.duelo_campeonato_enabled = true` ✅ **OK na sua marca**
2. **Camada 2** (Modelo de negócio) — registro em `brand_business_models` para `duelo_motorista` com `engagement_format = 'campeonato'` ❌ **FALTANDO** — não existe nenhum registro, então a RPC devolve o default `'duelo'`
3. **Camada 3** (Temporada) — só aparece o botão "Criar temporada" se a Camada 2 retornar `campeonato`

Como a Camada 2 está vazia, o componente cai no ramo `!isCampeonato` e mostra o card "Formato atual diferente de Campeonato. Selecione 'Campeonato' no seletor acima". O `SeletorFormatoEngajamento` aparece — mas trocar pra "Campeonato" também falha silenciosamente porque não há linha para fazer `UPDATE`, só insert via RPC.

## O que vou fazer

### 1) Corrigir a configuração da marca **Meu Mototáxi** (data fix via migration)

Migration única que:

- **Insere** o registro em `brand_business_models` para `brand_id = f6ca82ea-621c-4e97-8c20-326fc63a8fd0` × `business_model.key = 'duelo_motorista'` com:
    - `is_enabled = true`
    - `engagement_format = 'campeonato'`
    - `allowed_engagement_formats = ARRAY['campeonato']` (só o Campeonato fica liberado, os outros ficam **bloqueados com cadeado** no seletor)
- **Garante** `brand_settings_json.duelo_campeonato_enabled = true` (já está, mas reafirma idempotente).
- **Garante** `brand_settings_json.duelo_series_enabled = true` para liberar séries A/B/C/D.

### 2) Hardening da RPC `duelo_change_engagement_format`

Hoje, se a marca **não tem linha** em `brand_business_models`, a troca de formato falha em silêncio (UPDATE de zero linhas). Vou ajustar a RPC pra fazer **UPSERT** ao invés de UPDATE puro — assim qualquer marca futura que ative o campeonato pelo card "Ativar Campeonato" também ganha automaticamente a linha de modelo de negócio.

### 3) Garantir que o card "Ativar Campeonato" cria a base completa

Atualizar a RPC/função `useAlterarAtivacaoCampeonato` (camada 1) para, ao ativar, **também** criar/atualizar o registro em `brand_business_models` com `engagement_format='campeonato'` + `allowed_engagement_formats=['campeonato']` (default sensato pra novas marcas). Hoje só seta a flag no settings_json e deixa metade do fluxo solto.

### 4) Mensagem de erro clara no `SeletorFormatoEngajamento`

Pra evitar que o problema se repita, quando a troca de formato falhar (`UPDATE 0`), exibir toast: _"Não foi possível trocar o formato. A configuração da marca está incompleta — fale com o suporte."_ (proteção defensiva).

## Resultado esperado após implementar

Ao abrir **Gamificação → Cidade (Ipatinga - MG) → aba Campeonato**, você verá nesta ordem:

1. ✅ Card verde **"Campeonato ativo"** (já está)
2. ✅ Card **"Formato de engajamento"** com **apenas "Campeonato"** liberado (Duelo 1v1 e Desafio em Massa aparecem com ícone de cadeado)
3. ✅ Card central com botão **"Criar temporada"** habilitado → abre o wizard de 4 passos (Informações → Séries → Prêmios → Revisão)
4. ✅ Após criar a primeira temporada: Banner de status, menu **Ações** (Pausar, Cancelar, Incluir motorista, **Distribuir motoristas nas séries**, Ajustar prêmio), cards de cada série A/B/C/D, prêmios a distribuir, histórico

## Permissões

Não preciso mexer em `user_roles` — você já é Empreendedor da marca. Todas as ações do campeonato passam pela função `duelo_admin_can_manage(brand_id)` que valida `brand_admin` ou `root_admin` automaticamente.

## Arquivos a criar/editar

**Backend (1 migration):**
- `supabase/migrations/<timestamp>_meu_mototaxi_campeonato_only.sql`
    - Insert/upsert em `brand_business_models` para a marca alvo
    - Update no `brand_settings_json` (defensivo)
    - Hardening da função `duelo_change_engagement_format` (UPSERT em vez de UPDATE)
    - Hardening do trigger/RPC de ativação do campeonato pra criar a linha de modelo

**Frontend (1 arquivo):**
- `src/features/campeonato_duelo/hooks/hook_mutations_campeonato.ts` (ou onde estiver `useTrocarFormato`) — adicionar tratamento defensivo de erro quando a RPC retorna 0 linhas

## Risco e rollback

- **Risco baixo**: a migration é idempotente (`ON CONFLICT DO UPDATE`) e afeta só a marca Meu Mototáxi explicitamente nomeada.
- **Rollback trivial**: `DELETE FROM brand_business_models WHERE brand_id = 'f6ca82ea-...' AND business_model_id = ...` restaura ao estado atual.
- O hardening das RPCs é aditivo — qualquer marca com config correta segue funcionando igual.


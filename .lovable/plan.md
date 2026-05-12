# Etapa 8 — Aba Artilharia (Recordes)

Substituir o placeholder `'artilharia'` na página do campeonato do motorista por um ranking de top riders por janela de tempo, consumindo a RPC `driver_get_top_riders` já existente. Sem migrations, sem RPCs novas, sem escrita.

## Commit A — Camada de dados

Criar 3 arquivos novos:

**`src/features/campeonato_duelo/types/tipos_artilharia.ts`**
- `JanelaArtilharia = '24h' | '7d' | '15d' | '30d'`
- `TopRider { rank, driver_id, driver_name, photo_url, total_rides, has_prize }`

**`src/features/campeonato_duelo/services/servico_artilharia.ts`**
- `obterTopRiders(seasonId, window)`: chama `supabase.rpc('driver_get_top_riders', { p_season_id, p_window })` e retorna `TopRider[]`.

**`src/features/campeonato_duelo/hooks/hook_artilharia.ts`**
- `useTopRiders(seasonId, window, enabled)`:
  - queryKey `['campeonato-artilharia', seasonId, window]`
  - `staleTime: 60_000`, `refetchInterval: 120_000`
  - `enabled: !!seasonId && enabled`

## Commit B — `AbaArtilharia.tsx`

Criar `src/features/campeonato_duelo/components/motorista/AbaArtilharia.tsx`.

Props: `{ seasonId: string; driverId: string }`. Estado: `janelaAtiva` (default `'24h'`).

Layout (mobile-first 430px):

1. **Seletor**: 4 botões iguais em row (`grid-cols-4 gap-1`), bg `muted`, ativo com `bg-primary text-primary-foreground`. Labels: `24h`, `7 dias`, `15 dias`, `30 dias`.
2. **Header informativo**: texto explicativo compacto por janela (mapa fixo).
3. **Lista (top 20)**: cada linha com medalha/rank + `AvatarMotorista` (36px) + nome + `total_rides corridas` + ícone de prêmio.
   - 1º/2º/3º → emojis 🥇🥈🥉; 4º+ → número em `text-muted-foreground`.
   - `has_prize=true` → badge "Prêmio" verde com ícone Gift no fim da linha.
   - Linha do motorista logado (`driver_id === driverId`) → `bg-muted/50` + label "VOCÊ" em bold.
   - Separador visual sutil entre posições 3 e 4.
4. **Rodapé**: "Apenas corridas realizadas neste campeonato são contabilizadas." em `text-xs text-muted-foreground text-center`.

Estados: loading com 5 skeletons; vazio com mensagem; erro com botão "Tentar novamente" (chama `refetch`).

Tokens semânticos apenas (nada de cores hardcoded fora do verde do badge "Prêmio", que usa classes utilitárias `bg-emerald-500/15 text-emerald-700 dark:text-emerald-400` — padrão já em uso no projeto). Caso o codebase já tenha um token semântico `success`, usar.

## Commit C — Plugar na página

Em `src/features/campeonato_duelo/pages/pagina_campeonato_motorista.tsx`:
- Importar `AbaArtilharia`.
- Substituir `<PlaceholderAba ... />` do case `'artilharia'` por `<AbaArtilharia seasonId={seasonId} driverId={driverId} />`.
- Em `handleRefresh`, adicionar `queryClient.invalidateQueries({ queryKey: ['campeonato-artilharia', seasonId] })` (invalida todas as janelas via prefix match).

## Não fazer

- Não criar/alterar RPCs ou migrations.
- Não tocar em arquivos das Etapas 1–7 (exceto a página para plugar a aba).
- Não implementar outras abas.

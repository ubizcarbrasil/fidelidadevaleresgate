## Pré-check

**`driver_get_full_bracket(p_season_id, p_driver_id)`** retorna por confronto:
`bracket_id, round, slot, starts_at, ends_at, driver_a_id, driver_a_name, driver_a_rides, driver_b_id, driver_b_name, driver_b_rides, winner_id, is_me_involved`.

**Faltam:** `driver_a_photo_url`, `driver_b_photo_url`, info da temporada (`knockout_starts_at/ends_at`) e `phase_config` (de `duelo_season_phase_config`). Também não aceita `p_tier_id` (auto-resolvido pelo membership do driver — não permite ver outra série).

**Conclusão:** criar `driver_get_bracket_v2`. Não alterar `driver_get_full_bracket` nem `BracketCompleto.tsx`.

**`BracketCompleto.tsx`:** props `seasonId, driverId, fontHeading`; lista vertical agrupada por rodada, sem fotos, sem tap → detalhe. Não reaproveitável diretamente — manter intocado.

**`duelo_season_phase_config`:** `(season_id, phase, duration_hours)` com `phase IN ('R16','QF','SF','Final')`. Tem RLS que permite leitura ao motorista da brand+branch.

**`customers.photo_url`** existe; fallback via `driver_profiles.photo_url` (mesmo padrão do `driver_get_tier_standings_v2`).

---

## Commit A — RPC `driver_get_bracket_v2`

Migration nova. Função `SECURITY DEFINER`, `SET search_path = public`, `STABLE`, `REVOKE ALL FROM PUBLIC`, `GRANT EXECUTE TO authenticated`.

Assinatura:
```
driver_get_bracket_v2(p_season_id uuid, p_tier_id uuid, p_driver_id uuid) RETURNS jsonb
```

Lógica:
1. Resolve `v_brand_id` / `v_branch_id` a partir de `duelo_seasons`.
2. Valida `driver_belongs_to_brand(p_driver_id, v_brand_id)` → senão retorna `'{"season_info":null,"brackets":[]}'::jsonb`.
3. Carrega `season_info`: `knockout_starts_at`, `knockout_ends_at`, `phase_config` = `jsonb_agg({phase, duration_hours})` ordenado por R16→Final.
4. Carrega `brackets` filtrando por `season_id = p_season_id AND tier_id = p_tier_id`, com LEFT JOIN em `customers ca/cb` e `driver_profiles dpa/dpb` para `COALESCE(ca.photo_url, dpa.photo_url)`.
5. Campos retornados por bracket: `id, phase (=round), bracket_position (=slot), driver_a_id, driver_a_name, driver_a_photo_url, driver_b_id, driver_b_name, driver_b_photo_url, driver_a_rides, driver_b_rides, winner_id, starts_at, ends_at, is_my_match`.
6. Ordena por `CASE round` (r16=1, qf=2, sf=3, final=4), `slot`.

---

## Commit B — `AbaChaveamento.tsx`

Arquivos novos:
- `src/features/campeonato_duelo/types/tipos_chaveamento_motorista.ts` — tipos `BracketSlotV2`, `SeasonInfoBracket`, `BracketResponseV2`, `FasePhase = 'r16'|'qf'|'sf'|'final'`.
- `src/features/campeonato_duelo/services/servico_chaveamento_motorista.ts` — `obterBracketV2(seasonId, tierId, driverId)` chama RPC.
- `src/features/campeonato_duelo/hooks/hook_chaveamento_motorista.ts` — `useBracketCampeonatoV2(seasonId, tierId, driverId)` (`enabled` quando todos truthy, `staleTime: 30s`, `refetchInterval: 60s`, queryKey `['campeonato-bracket-v2', seasonId, tierId, driverId]`).
- `src/features/campeonato_duelo/components/motorista/AbaChaveamento.tsx`.

Componente `AbaChaveamento`:
- Props: `{ seasonId, tierId, driverId, faseDestaque?: 'r16'|'qf'|'sf'|'final' }` (faseDestaque vem do SubHeaderRodada via index).
- Estados: loading (skeletons), erro (mensagem + retry via refetch), vazio (`brackets.length === 0` → "O chaveamento ainda não foi gerado. Aguarde o fim da fase de classificação.").

**Seção 1 — Painel de regras (colapsável, default aberto):**
- Card `bg-card border-border` com `Collapsible` (shadcn) ou `details/summary`.
- Título "Regras do Mata-Mata".
- Para cada item de `phase_config` (mapear `R16→Oitavas`, `QF→Quartas`, `SF→Semifinal`, `Final→Final`): linha `⚔️ {label} — {duration_hours}h por confronto`. Final usa `🏆`.
- `📅 Início: {format(knockout_starts_at, dd/MM/yyyy)}`.
- `🏁 Final estimada: {format(knockout_ends_at, dd/MM/yyyy)}` (usa o campo da season; mais confiável que somar fases).
- Se `phase_config` vazio → mostrar só as datas.

**Seção 2 — Bracket interativo:**
- Wrapper `overflow-x-auto` com `min-w` calculado.
- 4 colunas (R16, QF, SF, Final) lado a lado; cada coluna `flex flex-col justify-around gap-y-{...}` com espaçamento crescente para alinhar verticalmente os pares (R16: gap-2, QF: gap-12, SF: gap-32, Final: gap-0 centralizado).
- Cada coluna oculta se não houver brackets daquela fase.
- Card de confronto (`button` clicável):
  - Slot superior e inferior, cada um: `[AvatarMotorista url={photo} nome={name} size={28}] <span truncate>{name ?? "A definir"}</span> <span tabular-nums>{rides ?? "—"}</span>`.
  - Vencedor (winner_id === driver_X_id): `font-bold` + `bg-primary/10`.
  - Slot vazio: avatar com `animate-pulse bg-muted`, texto `text-muted-foreground italic "A definir"`.
  - Borda padrão `border-border/40`; quando `is_my_match`: `border-primary ring-1 ring-primary/40`.
  - Coluna Final destacada com `🏆` acima.
- Linhas de conexão: SVG simples ou `border-r border-border/30` em pseudo-elementos (estrutura mínima, sem animação).
- `faseDestaque` aplica `ring-2 ring-accent/40` nos cards daquela fase.
- Tap em card com `driver_a_id && driver_b_id` (definido) → `setConfrontoSelecionado(bracket)` abre modal.

---

## Commit C — `ModalConfrontoChaveamento.tsx`

Arquivo novo: `src/features/campeonato_duelo/components/motorista/ModalConfrontoChaveamento.tsx`.

Props: `{ open, onOpenChange, confronto: BracketSlotV2 | null, phaseConfig: SeasonInfoBracket['phase_config'] }`.

Conteúdo do `Dialog` (shadcn, semantic tokens apenas):
- `DialogHeader` com `<Badge>` da fase (label legível: Oitavas/Quartas/Semifinal/Final).
- Linha central: `[AvatarMotorista 56px] NOME A` — `<span>VS</span>` — `[AvatarMotorista 56px] NOME B`.
- Placar: `{rides_a} corridas × {rides_b} corridas` (ou `— × —` se ambos zero e ainda não iniciado).
- `<Progress>` com `value = rides_a/(rides_a+rides_b) × 100` (50 se total=0). Acima do `<Progress>`, segunda barra invertida representando o lado B (ou usar dois divs com `flex` e width %).
- "Confronto de {duration_hours}h" buscando em `phaseConfig` pela `phase` correspondente. Se não houver config → omitir linha.
- Estado:
  - `winner_id` definido: `🏆 Vencedor: {nome do vencedor}` em `text-primary`.
  - `now < starts_at`: `Início: {format(starts_at, "dd/MM HH:mm")}`.
  - Em andamento (`now ≥ starts_at && now < ends_at && !winner_id`): countdown `Encerra em Xh Ym` via `setInterval` 60s.
- `DialogFooter` com botão "Fechar".

Sem cores hardcoded; tudo via tokens (`text-primary`, `text-muted-foreground`, `bg-card`, etc.).

---

## Commit D — Plugar em `pagina_campeonato_motorista.tsx`

Edição mínima:
1. Import `AbaChaveamento`.
2. Mapear `rodadaIndex → faseDestaque` (`1→'r16'`, `2→'qf'`, `3→'sf'`, `4→'final'`).
3. No bloco `'chaveamento'`, substituir `<PlaceholderAba>` por:
   ```tsx
   <AbaChaveamento
     seasonId={seasonId}
     tierId={serieVisualizando ?? temporada?.tier_id ?? null}
     driverId={driverId}
     faseDestaque={faseDestaqueChaveamento}
   />
   ```
   (renderizar somente se os 3 ids truthy; senão skeleton/empty).
4. No `handleRefresh`, adicionar:
   ```ts
   queryClient.invalidateQueries({ queryKey: ['campeonato-bracket-v2', seasonId] });
   ```
5. Não alterar `SubHeaderRodada` nem outras abas.

---

## Não fazer

- Não alterar `BracketCompleto.tsx`, `quadro_chaveamento.tsx`, `driver_get_full_bracket`.
- Sem migrations de tabela, sem escrita Supabase.
- Sem cores hardcoded — apenas tokens semânticos.
- Sem tocar arquivos das Etapas 1–6 além do `pagina_campeonato_motorista.tsx` (Commit D).
- Sem animações complexas — só estrutura e interação funcionais.

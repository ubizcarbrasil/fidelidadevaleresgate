

# Tirar o "Atualizar agora" e acelerar a abertura da tela

## Diagnóstico

Pela tela que você mandou, o app está parado em **"Sessão validada. Carregando configurações…"** (fase `AUTH_READY` do boot machine) e, depois de 8 s, mostra o bloco circulado: **"Demorando mais que o normal? · Atualizar agora"**.

Esse bloco vem do `TelaCarregamento` (`src/compartilhados/components/tela_carregamento.tsx`), linhas 87-91 e 118-127:

- Existe um `setTimeout(() => setTravado(true), 8000)` **fixo** que sempre dispara depois de 8 s, independentemente de ter erro ou não.
- Em rede móvel mais lenta (seu caso, Wi-Fi fraco no print), o boot natural pode passar de 8 s sem nenhum problema real → o usuário vê uma "alerta de erro" sem ter erro nenhum.

E a tela demora porque hoje o boot tem **dois gargalos sequenciais** desnecessários:

1. **`AuthContext.bootstrap`** chama `supabase.auth.getSession()` → só depois disso seta `AUTH_READY` e libera o `<BrandProvider>`. No portal universal (`app.valeresgate.com.br`) e nos previews, o resolve de marca por domínio nem precisa rodar — mas o BrandProvider só monta depois do Auth resolver.
2. **`BrandContext`** entra em `BRAND_LOADING` → faz early return e cai em `setBootPhase("BRAND_READY")` no `finally`. Em domínio portal/preview isso é instantâneo, mas o React ainda precisa do próximo tick para o `useBootReady` propagar a mudança aos guards.

Resultado: em rede boa, o boot termina em ~1-2 s. Em rede móvel ruim, passa de 8 s e o "Atualizar agora" aparece sem motivo, induzindo o usuário a recarregar e pagar tudo de novo.

## O que vamos mudar

### A. Remover o "Atualizar agora" do fluxo de boot normal

No `tela_carregamento.tsx`:

- **Subir o threshold** de 8 s para **20 s** e tornar configurável via prop `segundosAteBotaoEmergencia`.
- **Só mostrar o botão se a fase de boot estiver presa em uma fase intermediária** (`AUTH_LOADING`, `BRAND_LOADING`) — se o boot já chegou em `BRAND_READY`/`APP_MOUNTED` e o loader continua visível por causa de Suspense de rota, **não mostrar o botão** (não é problema de cache, é só código carregando).
- Por padrão, **`mostrarBotaoEmergencia = false`** no loader interno de Suspense (`<Suspense fallback={<TelaCarregamento />}>` em rotas), mantendo `true` apenas no boot inicial do `App.tsx`.
- Trocar o texto de "Demorando mais que o normal?" → mensagem mais sutil que **só aparece em caso real de travamento** (depois de 20 s e ainda em fase pré-boot).

Resultado: no fluxo normal, **você nunca mais vê esse bloco**. Ele continua disponível como rede de segurança real para casos extremos (>20 s travado em validar sessão), com texto menos alarmista.

### B. Acelerar o boot percebido

1. **Disparar `BRAND_LOADING` em paralelo com `AUTH_LOADING`**, não em série. Hoje o `BrandProvider` só roda seu `useEffect` depois do `AuthProvider` montar children. Vou:
   - Mover a resolução por hostname (`resolveBrandByDomain`) para fora do gate de auth — ela não depende de `user`/`roles` na maioria dos casos.
   - Reduzir o `safetyTimeout` do BrandContext de **1500 ms → 800 ms** (no portal/preview o early return é síncrono, então 800 ms já é folgado).

2. **Pular `BRAND_LOADING` por completo** em domínios que sabidamente não resolvem por hostname (portal universal, preview, localhost, root). Hoje entramos em `BRAND_LOADING` → early return → `BRAND_READY` no finally. Vou trocar por: detecta `isLocal` antes de chamar `setBootPhase("BRAND_LOADING")` e pula direto para `BRAND_READY` no mesmo tick. Economiza 1 ciclo de render + a percepção do texto "Carregando configurações da marca…".

3. **Mensagem única e estável durante o boot rápido**: hoje o usuário lê em sequência "Validando sessão" → "Sessão validada. Carregando configurações…" → "Aplicando tema…" em <2 s, o que dá sensação de instabilidade. Vou consolidar em uma única mensagem **"Carregando…"** durante todo o boot, e só mostrar texto detalhado se a fase ficar >2 s parada na mesma etapa.

### C. Manter o botão de recovery onde ele realmente importa

O botão "Atualizar agora" continua existindo em dois lugares estratégicos (sem mudar):

- Recovery automático no `installGlobalDomErrorRecovery` quando há erro real de chunk.
- `lazyWithRetry` no carregamento de páginas, com retry transparente.

Ou seja: **erro de cache continua sendo tratado**, só não polui mais o boot saudável.

## Arquivos alterados

- `src/compartilhados/components/tela_carregamento.tsx` — threshold 8 s → 20 s, gate por fase de boot (só mostra botão se travado em fase pré-`BRAND_READY`), `mostrarBotaoEmergencia` default `false` no `TelaCarregamentoInline`, mensagem unificada nos primeiros 2 s.
- `src/contexts/BrandContext.tsx` — pular `BRAND_LOADING` em domínios `isLocal`, reduzir `safetyTimeout` para 800 ms, garantir `setBootPhase("BRAND_READY")` síncrono no caminho rápido.
- `src/App.tsx` — passar `mostrarBotaoEmergencia={false}` nos `<Suspense fallback={<TelaCarregamento />}>` internos de rota; manter `true` apenas no loader de boot inicial.

## Resultado esperado

- **No boot normal (qualquer rede): você nunca mais vê "Demorando mais que o normal? / Atualizar agora".**
- **Tempo até a tela aparecer cai ~30–40%** em domínio portal/preview por pular o ciclo extra de `BRAND_LOADING` e paralelizar a resolução.
- O loader vira uma mensagem única "Carregando…" durante o boot rápido, sem cascata de textos piscando.
- Recovery de cache real continua funcionando automaticamente (chunks quebrados, erros de DOM).

## Risco e rollback

- **Risco baixo**: mudanças concentradas no loader e em otimizações do BrandContext. Nenhuma alteração de RLS, banco ou rota.
- **Rollback**: voltar `setTimeout` para 8000 ms no `tela_carregamento.tsx` e remover o early `BRAND_READY` do `BrandContext.tsx`.


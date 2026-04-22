

# Corrigir importação de planilha no iPhone/PWA + endurecer fluxo

## Diagnóstico

A importação de planilha não está com bug no servidor — os dois últimos jobs no banco terminaram com sucesso (2.566 e 1.706 linhas, 0 erros). O problema é **na camada do app no iPhone PWA standalone**, e tem 3 causas combinadas:

### 1. Service Worker está sequestrando o polling do job (causa principal)

`vite.config.ts` configura `runtimeCaching` para **todas** as chamadas Supabase como `NetworkFirst` com cache de 5 minutos:

```text
urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i
handler: "NetworkFirst"
networkTimeoutSeconds: 10
maxAgeSeconds: 60 * 5
```

O loop `acompanharJob()` faz polling em `/rest/v1/driver_import_jobs?id=eq.<jobId>` a cada 1,5s. No iPhone PWA:

- Primeiro polling → SW armazena resposta `{status:"running", processed_rows:0}` no cache `supabase-api`
- Próximos pollings → SW devolve a **mesma resposta cacheada** por até 5 minutos (NetworkFirst com timeout de 10s frequentemente cai pro cache em rede móvel)
- Resultado: barra de progresso fica em 0%, status nunca muda de "running" → usuário acha que travou e fecha

Na imagem do usuário "deu o mesmo" — é o mesmo padrão visual do export anterior: app fica travado, sem feedback claro.

### 2. Falta de feedback quando o picker do iOS retorna nada

`etapa_upload.tsx` resetar `e.target.value = ""` ANTES do `if (!file)` — se o usuário cancela o picker no iOS PWA, não acontece nada visível. Soma com o item 1 dá sensação de "não funciona".

### 3. Sem botão "Voltar / Atualizar status" na etapa de progresso

Se o polling realmente travar (cache, perda de rede, app em background), o usuário não tem como destravar. `etapa_progresso.tsx` só tem spinner.

## Solução

### 1. Excluir Edge Functions e tabela de jobs do cache do Service Worker

Em `vite.config.ts`, separar regras de cache:

- `/functions/v1/*` → **NetworkOnly** (nunca cachear, nunca timeout — invocações de edge function)
- `/rest/v1/driver_import_jobs*` → **NetworkOnly** (polling de jobs precisa ser sempre fresco)
- `/storage/v1/object/sign/*` e `/storage/v1/object/upload/*` → **NetworkOnly** (uploads e URLs assinadas)
- Demais rotas Supabase → manter `NetworkFirst` mas reduzir cache para 60s e remover `networkTimeoutSeconds` agressivo (15s ou sem timeout)
- Bump do `cacheId` para `vale-resgate-v7` para invalidar SW antigo no iPhone

### 2. Endurecer o hook `useImportarMotoristas.acompanharJob`

- Adicionar `cache: "no-store"` e `headers: { "Cache-Control": "no-cache, no-store" }` na query de polling
- Trocar query Supabase pelo cliente direto com `.select(...).eq(...).single()` mais um parâmetro `?_t=Date.now()` para forçar bypass de cache até em proxies legados
- Adicionar timeout de segurança: se 60s passarem sem evolução em `processed_rows`, mostrar aviso "Sem resposta do servidor — atualize a página". Não cancela o job (ele continua no servidor) mas avisa o usuário
- Adicionar tentativa máxima de 20 minutos absoluta antes de desistir do polling

### 3. Melhorar UX de erro/recuperação na importação

- `etapa_upload.tsx`:
  - Reset do `value` só DEPOIS de tratar o arquivo
  - Toast informativo se o iOS retornar arquivo vazio (`size === 0`)
  - Validar `file.size > 0` antes de tentar parsear
  - Mensagem específica para iPhone: "No iPhone, escolha o arquivo em **Arquivos** → **iCloud Drive** ou **No meu iPhone**"
  
- `etapa_progresso.tsx`:
  - Adicionar botão "Atualizar status" (consulta o job manualmente)
  - Adicionar botão "Fechar e continuar em segundo plano" — fecha o modal mas mostra um toast persistente "Importação em andamento" com link para conferir depois
  - Mostrar `job_id` curto para rastreabilidade

- `modal_importar_motoristas.tsx`:
  - Capturar erro do `acompanharJob` e voltar para etapa "resultado" com mensagem amigável em vez de spinner infinito

### 4. Acrescentar botão "Conferir última importação" na página

Em `DriverManagementPage.tsx`, ao lado de "Importar planilha", adicionar um pequeno indicador discreto que aparece quando há um `driver_import_jobs` recente do usuário com status `running`. Clicar abre o modal direto na etapa de progresso com aquele `jobId` — recupera importação que travou no celular.

## Arquivos impactados

**Editados (4):**

- `vite.config.ts` — separar regras de cache do SW para edge functions / driver_import_jobs / storage; bump `cacheId` v6 → v7
- `src/features/importacao_motoristas/hooks/hook_importar_motoristas.ts` — polling resistente a cache, timeout de 20min, retorno de erro recuperável, suporte a "anexar a job existente"
- `src/features/importacao_motoristas/components/etapa_upload.tsx` — validação `file.size > 0`, dica iOS, reset correto do input
- `src/features/importacao_motoristas/components/etapa_progresso.tsx` — botões "Atualizar" e "Continuar em segundo plano"
- `src/features/importacao_motoristas/components/modal_importar_motoristas.tsx` — fluxo de erro amigável, suporte a reabrir modal em job existente
- `src/pages/DriverManagementPage.tsx` — indicador "importação em andamento" + atalho para retomar

**Sem migration. Sem mudança em RLS. Sem mudança no edge function `import-drivers-bulk` (que já funciona).**

## Resultado esperado

| Ação no iPhone PWA | Antes | Depois |
|---|---|---|
| Tocar "Importar planilha" → escolher CSV | Picker abre | Igual |
| Confirmar importação | Spinner trava em 0% por causa do SW cache | Barra avança em tempo real |
| Sair do app durante importação | Volta e vê 0% (cache) | Volta e vê progresso real ou "concluído" |
| Cancelar picker do iOS | Nada acontece (parece bug) | Modal continua aberto, sem erro |
| Polling demora ou trava | Spinner infinito | Botão "Atualizar status" + "Continuar em segundo plano" |
| Página recarregada com job em curso | Perde referência | Indicador "Importação em andamento — toque para acompanhar" |

## Risco e rollback

- **Cache do SW**: bump de `cacheId` força todos os usuários a baixarem novo bundle uma vez. Sem efeito em dados.
- **Polling**: mudança é puramente de cliente; servidor continua igual.
- Rollback: reverter os 5 arquivos.
- Sem efeito em outras features (cache do SW para Supabase em geral fica mais permissivo, não restritivo — só removemos das rotas problemáticas).


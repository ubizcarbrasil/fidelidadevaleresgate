

# Importação de motoristas resiliente para iPhone/PWA

## Diagnóstico (o que está acontecendo de verdade)

**O servidor está 100% funcional**: as duas últimas importações no banco terminaram com sucesso — 2.566 linhas em 17s e 1.706 linhas em 3min, ambas com `error_count = 0`.

O problema é exclusivamente no caminho cliente → servidor no **iPhone em PWA standalone**:

1. **Export antigo cacheado (imagem 1, "Não foi possível abrir o compartilhamento nativo")** — o iPhone do usuário ainda está rodando o bundle antigo (Service Worker v6) porque o novo SW (v7) só é ativado depois de fechar a PWA totalmente. Por isso a mensagem de erro mostrada é de uma versão de código que nem existe mais no projeto.
2. **Import via `<input type=file>` + `functions.invoke()`** — o iOS PWA tem dois problemas:
   - Pode aceitar a planilha pelo seletor mas devolver `file.size = 0` quando o arquivo vem do Mail/WhatsApp.
   - O `supabase.functions.invoke()` envia o JSON inteiro com 5.000 linhas no body — em rede móvel, o Safari fecha a conexão silenciosamente em ~30s e o `await` nunca resolve. Para o usuário, "não acontece nada".
3. **Sem feedback de "como tirar a versão velha do PWA"** — o usuário não sabe que precisa fechar a aba e reabrir.

## Solução

### 1. Forçar a saída do SW antigo no iPhone (efeito imediato)

- Bump de `cacheId` para `vale-resgate-v8` em `vite.config.ts`.
- Adicionar `clientsClaim: true` e `skipWaiting: true` no Workbox para que o SW novo assuma sem precisar fechar o app.
- Adicionar pequeno banner discreto no topo da página de Motoristas dizendo "Nova versão pronta — toque para atualizar" quando detectar SW novo aguardando.

### 2. Trocar o caminho do upload de planilha (paralelo ao que fizemos no export)

Hoje: `lê arquivo no browser → manda 5.000 linhas em JSON pra edge function → polling`.
Novo: `lê arquivo → upload do arquivo bruto pro Storage → edge function lê do Storage → polling`.

**Por que resolve no iPhone:**
- Upload pro Storage usa `fetch` chunked nativo do navegador — funciona em rede móvel mesmo com o app em background.
- O JSON gigante deixa de trafegar pelo `functions.invoke()`, que é o passo frágil.
- A edge function lê o arquivo já hospedado e processa do mesmo jeito que hoje (chunks de 500).

**Implementação:**
- Novo bucket privado `importacoes-motoristas` com RLS por `auth.uid()` (mesmo padrão de `exportacoes-motoristas`).
- Front: depois do parse local, salvar a planilha como JSON normalizado (`linhas-mapeadas.json`) e fazer `upload()` pro Storage.
- `iniciarImportacao()` chama a edge function passando apenas `{ brand_id, branch_id, storage_path }` — payload pequeno, não estoura timeout do invoke.
- Edge function `import-drivers-bulk` ganha um caminho alternativo: se receber `storage_path` em vez de `rows`, baixa do Storage e processa. A lógica de chunk/match continua idêntica.

### 3. Robustecer o seletor de arquivo no iPhone

- Detectar `file.size === 0` e mostrar mensagem clara: "O iPhone devolveu arquivo vazio. Salve a planilha em **Arquivos → No meu iPhone** antes de importar."
- Aceitar também `text/csv`, `text/plain` e `application/vnd.ms-excel` no atributo `accept` (alguns CSVs do Excel para Mac chegam com MIME `text/plain`).
- Botão "Colar conteúdo CSV" como fallback: o usuário copia o CSV e cola num textarea — bypassa totalmente o seletor de arquivo do iOS quando ele falha.

### 4. Tornar o "Acompanhar importação" mais visível

- Quando há job em `pending` ou `running` da última 1h, mostrar um card no topo da página (não só o botãozinho) com:
  - Linhas processadas / total
  - Botão "Atualizar status"
  - Botão "Continuar em segundo plano"
  - Aviso: "Você pode fechar o app — a importação continua no servidor."

### 5. Cobertura por testes automáticos (regressão)

- **Unit** em `parser_planilha.ts`: detecção de `file.size = 0`, MIME variantes, parse de XLSX/CSV.
- **Hook** `useImportarMotoristas`: garantir que o `iniciarImportacao` chama upload de Storage e NUNCA envia `rows` no body quando o arquivo passa do limite de payload.
- **E2E (vitest+jsdom simulando iPhone PWA)**:
  - simula `navigator.standalone = true` + UA iPhone
  - dispara importação com 1.000 linhas
  - valida que houve `storage.upload()` e que o `functions.invoke` recebeu apenas `storage_path`, não `rows`
  - valida que o estado evolui pra `progresso` e que o polling usa `cache:"no-store"`

## Arquivos impactados

**Editados (6):**
- `vite.config.ts` — `cacheId: vale-resgate-v8`, `clientsClaim`, `skipWaiting`.
- `src/features/importacao_motoristas/hooks/hook_importar_motoristas.ts` — fluxo via Storage.
- `src/features/importacao_motoristas/components/etapa_upload.tsx` — validação `file.size`, fallback "Colar CSV", MIMEs estendidos.
- `src/features/importacao_motoristas/components/modal_importar_motoristas.tsx` — capturar erros do upload.
- `src/pages/DriverManagementPage.tsx` — card "Importação em andamento" no topo + banner "atualizar versão" quando SW novo aguardando.
- `supabase/functions/import-drivers-bulk/index.ts` — aceitar `storage_path` como entrada alternativa, baixando o JSON do bucket.

**Novos (3):**
- `src/features/importacao_motoristas/utils/upload_planilha_storage.ts` — wrapper para subir o JSON normalizado.
- `src/features/importacao_motoristas/utils/__tests__/parser_planilha.test.ts` — testes do parser.
- `src/features/importacao_motoristas/hooks/__tests__/hook_importar_motoristas.test.ts` — testes do hook + cenário iPhone PWA.

**Migration (1):**
- Bucket privado `importacoes-motoristas` + RLS por `auth.uid()` (insert/select/delete só do dono, igual ao bucket de export).

**Sem alteração em RLS de tabelas, sem mudança no schema dos jobs.**

## Resultado esperado no iPhone PWA

| Ação | Antes | Depois |
|---|---|---|
| Abrir app pela manhã | SW v6 cacheado, mensagem antiga "compartilhamento nativo" | SW v8 assume na hora; banner discreto se houver atualização |
| Importar planilha 4.000 linhas | `invoke()` morre em 30s, nada acontece | Upload do JSON ao Storage (~3s) + edge processa em background |
| Selecionar CSV vindo do WhatsApp | `file.size = 0`, sem erro | Toast claro: "salve em Arquivos antes" |
| App vai pra background no meio | Perde polling | Edge segue processando; ao voltar, card mostra status real |
| Polling trava | Spinner infinito | Botão "Atualizar status" + "Continuar em segundo plano" |

## Risco e rollback

- **SW**: bump força recarregamento de bundle uma única vez por usuário. Sem efeito em dados.
- **Edge function**: aceita os dois formatos (`rows` legado E `storage_path` novo) — zero regressão em quem ainda usa o caminho antigo.
- **Bucket novo**: isolado por `auth.uid()` via RLS. Pode ser dropado sem afetar outros buckets.
- Rollback trivial: reverter os 6 arquivos + remover bucket via migration.


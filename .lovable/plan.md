

# Erro "Importing a module script failed" — corrigir cache stale do PWA

## Diagnóstico

O erro de runtime que você está vendo:

> `TypeError: Importing a module script failed.`
> `chunk-YQECZGAV.js?v=e1ebb75e`

**não é um bug do código** das mudanças recentes (BrandForm, distribuição de motoristas, etc.). É o sintoma clássico de **cache stale do Service Worker** do PWA:

1. Você abriu a versão anterior do app no celular → o SW (`vale-resgate-v8`) cacheou os chunks daquela build.
2. Eu publiquei builds novas (BrandForm + distribuição em lote + outras) → cada build gera nomes de chunk novos (`chunk-XXX.js`).
3. O SW antigo continua tentando importar o chunk velho que não existe mais → `import()` falha → app trava na entrada.

Isso bate com a regra do projeto registrada em memória:

> **PWA Cache** — SW manual versioning and clearing stale chunks. Bump `cacheId` in `vite.config.ts` when invalidating old SW + caches on client.

O `cacheId` atual está em **`vale-resgate-v8`** desde a Fase "Import via Storage". Várias mudanças estruturais saíram depois disso sem bump → caches antigos continuam grudados em iPhone/Android via PWA instalado.

## Correção

### A. Bumpar o `cacheId` do PWA (correção principal)

Em `vite.config.ts`, subir de `v8` para **`vale-resgate-v9`** com comentário explicando o motivo (segue o padrão das versões anteriores). Isso:

- Força `cleanupOutdatedCaches: true` a apagar todos os caches v1..v8 no próximo carregamento.
- `skipWaiting: true` + `clientsClaim: true` (já ativos) fazem o SW novo assumir imediatamente sem esperar todas as abas fecharem.
- Próxima visita ao app: SW novo entra, baixa o bundle atual, descarta os chunks fantasmas → erro some.

### B. Failsafe para o usuário em sessão travada

Como você já está com o erro acontecendo agora no celular, depois do deploy do bump:

- Fechar completamente o PWA (swipe out do app no iOS) e reabrir → SW novo assume, app carrega.
- Se persistir: tocar em "Atualizar conteúdo" no menu (se existir) ou desinstalar/reinstalar o PWA. Não precisa limpar dados manualmente.

Vou também verificar se há uma tela de "atualização disponível" registrada no `main.tsx` — se não houver, fica pra outra rodada (não é prioridade agora).

## Arquivos alterados

- `vite.config.ts` — `cacheId: "vale-resgate-v8"` → `"vale-resgate-v9"` + comentário inline registrando a versão e o motivo.

## Resultado esperado

- Após o deploy + reabrir o PWA, o erro `Importing a module script failed` desaparece.
- Bundles novos das últimas funcionalidades (seletor de plano no BrandForm, distribuição em lote do Campeonato, etc.) passam a carregar corretamente no celular.
- Não há alteração funcional — apenas invalidação de cache.

## Risco e rollback

- **Risco mínimo**: mudança de uma única string de versionamento. Padrão já usado 7 vezes antes no projeto.
- **Rollback**: voltar `cacheId` para `"vale-resgate-v8"` (não recomendado — manteria o problema).


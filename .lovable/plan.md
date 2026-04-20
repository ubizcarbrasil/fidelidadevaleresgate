

# Diagnóstico — Erro "removeChild" ao abrir Motorista no celular

## O que está acontecendo

A tela de erro que você fotografou **é o `ErrorBoundary`** do app sendo acionado pelo erro:

```
Failed to execute 'removeChild' on 'Node':
The node to be removed is not a child of this node.
```

Esse erro NÃO é do seu código diretamente — é o React tentando desmontar um nó do DOM que **outro código já removeu/moveu**. As 3 causas mais prováveis no seu cenário são:

### 1. PWA com bundle antigo em cache (causa mais provável)
Você fez muitas publicações seguidas (mobile pass 1, duelo, mobile pass 2). O **service worker** instalado no celular do usuário está servindo uma mistura de:
- HTML/JS novo (recém-publicado)
- chunks antigos em cache

Quando o React tenta hidratar uma árvore montada por um chunk e desmontada por outro, dá exatamente esse erro.

### 2. Conflito de Portal do Radix Sheet/Dialog
Em `DriverDetailSheet.tsx`, o `<Sheet>` fica **sempre montado** (`open={!!driver}`), e o conteúdo só renderiza quando `driver` existe. Combinado com a nova classe `tabs-scroll-mobile -mx-1 px-1` (que altera o layout dentro de um portal animado), o Radix Portal pode tentar remover um filho que a animação já desmontou.

### 3. Classe Tailwind inexistente (`xs:`)
Em `DriverManagementPage.tsx` linha 132 tem `hidden xs:inline sm:inline` — `xs` não existe no Tailwind por padrão, vira ruído (não trava sozinho).

## O que vou corrigir

### Correção 1 — Forçar reset agressivo do PWA (resolve 90% do caso)
- Em `pwaRecovery.ts`: adicionar `bumpedVersion` checagem por hash de build
- Em `App.tsx`: detectar erro `removeChild` globalmente e auto-disparar `recoverFromChunkError()` (limpa SW + cache + reload), sem o usuário precisar clicar em nada
- Em `ErrorBoundary.tsx`: tratar erros `removeChild`/`insertBefore`/`Node` como erro de cache (mesma tela amigável do `isChunkError`, com botão "Recarregar app")
- Atualizar a versão do service worker em `vite.config.ts` para invalidar todos os caches existentes nos celulares

### Correção 2 — Hardening do `DriverDetailSheet`
- Mudar de `<Sheet open={!!driver}>` sempre montado para **renderização condicional** (`{driver && <Sheet open ...>}`), evitando que o Radix mantenha um portal vazio que conflita com animação mobile
- Garantir `key={driver.id}` no `Sheet` para o React tratar trocas de motorista como remontagem limpa
- Mover o `tabs-scroll-mobile` para um `div` interno fora do `TabsList` para não competir com o Radix

### Correção 3 — Limpeza
- Remover `xs:inline` (classe inexistente) → trocar por `sm:inline`
- Aplicar o mesmo padrão de Sheet defensivo no `ManualDriverScoringDialog` quando aberto via mobile

### Correção 4 — Diagnóstico permanente
- Adicionar `reportError` no listener global de `window.error` para capturar `removeChild` futuros e enviar pro Sentry com a versão do bundle, pra você ver no painel se voltar a acontecer

## Arquivos editados

| Arquivo | Mudança |
|---|---|
| `src/lib/pwaRecovery.ts` | versionamento por build hash + auto-recover hook |
| `src/App.tsx` | listener global pra erros DOM + dispara recover |
| `src/components/ErrorBoundary.tsx` | tratar `removeChild` como chunk error |
| `src/components/driver-management/DriverDetailSheet.tsx` | render condicional + key estável + reorganizar abas |
| `src/pages/DriverManagementPage.tsx` | remover `xs:inline` |
| `vite.config.ts` | bump da versão do SW pra invalidar caches mobile existentes |

## Como testar depois (no celular onde deu erro)

1. Publicar
2. **Fechar completamente o PWA** (não só minimizar — fechar pela lista de apps recentes)
3. Reabrir o PWA — vai forçar o novo SW a assumir
4. Acessar Motoristas → tocar no olho de um motorista → ficha deve abrir normal
5. Trocar de aba (Dados → Pontos → Extrato) sem travar
6. Fechar a ficha → reabrir outra → sem erro

## Risco e rollback

- **Risco baixo**: nenhuma mudança funcional, só hardening de DOM e cache
- **Rollback**: reverter os 6 arquivos via histórico
- **Sem migração SQL, sem edge function nova**

## Estimativa

~10 min. `npx tsc --noEmit` esperado limpo.


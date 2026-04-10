
Objetivo: eliminar o loop infinito no link do motorista e fazer o link da Ubiz Resgata abrir de forma estável em iOS e Android.

O que identifiquei
- O print mostra que o navegador fica preso no host `www.valeresgata.ubizcar.com.br`.
- Hoje a Ubiz Resgata está configurada com `driver_public_base_url = https://fidelidadevaleresgate.lovable.app`.
- O `/driver` compara `window.location.origin` com a origem canônica e redireciona sempre que forem diferentes.
- Se o usuário entra por um domínio antigo/incorreto, esse redirecionamento pode se repetir sem uma trava de proteção, principalmente com cache/SW no mobile.
- Há também um segundo risco: `src/lib/publicShareUrl.ts` ainda consulta `brands` diretamente para descobrir a URL pública. Em sessão anônima/mobile isso pode falhar por RLS e cair em fallback inconsistente.
- A Central de Links ainda usa `getPublicOriginSync`, que depende de cache em memória; na primeira renderização ela pode montar links antes da origem canônica estar resolvida.

Causa mais provável do loop
- Redirecionamento automático no `DriverPanelPage` sem proteção contra repetição por sessão/URL.
- Geração de links públicos ainda não 100% centralizada/assíncrona.
- Cache antigo no navegador mobile reaproveitando host errado.

Plano de correção
1. Blindar o redirecionamento do `/driver`
- Ajustar `src/pages/DriverPanelPage.tsx` para redirecionar no máximo 1 vez por sessão/URL.
- Salvar uma chave curta em `sessionStorage` com `brandId + host atual + host destino`.
- Se a mesma tentativa já aconteceu, não redirecionar novamente e seguir carregando a marca.
- Normalizar comparação por hostname, ignorando pequenas diferenças cosméticas de protocolo/barra final.

2. Extrair e centralizar a regra de origem canônica
- Mover a resolução de origem para `src/lib/publicShareUrl.ts`.
- Fazer `DriverPanelPage` reutilizar a mesma função, evitando duplicação.
- A função deve ler primeiro a view pública/segura da marca e depois `brand_domains`, sem depender da tabela `brands` em acesso anônimo.

3. Corrigir geradores de link para não depender de cache síncrono
- Atualizar `src/features/pagina_links/pagina_links.tsx`.
- Atualizar `src/components/dashboard/DashboardQuickLinks.tsx`.
- Em vez de montar o link público com valor síncrono possivelmente vazio, resolver a origem canônica de forma assíncrona e só então exibir/copiar o link final.
- Resultado: os links novos da Ubiz Resgata sempre sairão com a URL correta.

4. Endurecer a proteção contra cache antigo no mobile
- Revisar `index.html` para subir a versão da limpeza de SW/cache.
- Garantir que a rotina de recuperação rode uma vez só e não contribua para novo ciclo de reload.
- Manter a limpeza, mas sem transformar isso em outro loop.

5. Validar a configuração pública da marca
- Confirmar que a Ubiz Resgata continuará apontando para `https://fidelidadevaleresgate.lovable.app` como base pública.
- Se existir domínio antigo da Ubiz Car sendo compartilhado para a Ubiz Resgata, o sistema deve corrigir via redirecionamento único e os novos links devem sair corretos.

Arquivos envolvidos
- `src/pages/DriverPanelPage.tsx`
- `src/lib/publicShareUrl.ts`
- `src/features/pagina_links/pagina_links.tsx`
- `src/components/dashboard/DashboardQuickLinks.tsx`
- `index.html`

Validação após implementar
1. Abrir o link antigo errado no iPhone e confirmar que no máximo ocorre 1 redirecionamento
2. Confirmar que a tela de CPF carrega sem ficar em spinner infinito
3. Gerar novo link da Ubiz Resgata na Central de Links
4. Copiar o link novo e abrir em Android/iPhone
5. Confirmar que os links novos sempre usam o domínio publicado correto da Ubiz Resgata

Detalhes técnicos
- Hoje o código mais sensível está em `DriverPanelPage.tsx`, linhas do bloco que chama `window.location.replace(...)`.
- `publicShareUrl.ts` ainda usa `supabase.from("brands")`, o que é frágil para contexto anônimo.
- O comportamento desejado é:
```text
host errado -> 1 redirecionamento controlado -> host canônico -> carrega login CPF
```
e nunca:
```text
host errado -> redirect -> reload/cache -> redirect -> reload -> loop
```

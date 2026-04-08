
Objetivo

Corrigir os links de Cliente e Motorista que continuam caindo em “Marca não encontrada”.

Diagnóstico

O problema mais provável não está no `brandId` em si, mas no jeito como a Central de Acessos monta e abre os links:
- `src/features/pagina_links/pagina_links.tsx` ainda usa `BASE_URL` fixo com o domínio publicado.
- Quando o clique acontece a partir do preview, os cards podem abrir outro ambiente/domínio.
- Isso faz Cliente e Motorista continuarem indo para uma versão antiga/cacheada, mesmo com a correção já existente no código atual.

Plano de implementação

1. Ajustar a feature `pagina_links`
- remover o `BASE_URL` fixo
- montar os links com a origem atual (`window.location.origin`) ou com rota relativa
- garantir que os cards sempre abram no mesmo ambiente em que o usuário está navegando

2. Corrigir a navegação dos cards
- substituir o uso de URL absoluta fixa por navegação same-origin
- manter os parâmetros reais já buscados do banco (`brandId`, `branchId`, `storeId`)
- evitar que Cliente e Motorista abram uma versão diferente da aplicação

3. Fortalecer o carregamento das páginas públicas
- em `CustomerPreviewPage.tsx` e `DriverPanelPage.tsx`, separar melhor:
  - marca inexistente
  - erro de consulta
  - parâmetro ausente/inválido
- usar leitura mais defensiva (`maybeSingle` ou tratamento equivalente) para não transformar qualquer falha em “Marca não encontrada”

4. Validar ponta a ponta
- testar `/links` no preview
- testar `/links` no publicado
- clicar em “App Cliente” e “Motorista”
- validar em mobile, deslogado e com `brandId` real

Arquivos envolvidos

- `src/features/pagina_links/pagina_links.tsx`
- `src/pages/CustomerPreviewPage.tsx`
- `src/pages/DriverPanelPage.tsx`
- opcional: `src/features/pagina_links/utils/utilitarios_links.ts`

Detalhes técnicos

```text
ANTES
/links -> domínio publicado fixo -> pode abrir build antiga/cacheada

DEPOIS
/links -> origem atual/rota relativa -> mesmo ambiente -> brandId real -> tela correta
```

Resultado esperado

Ao clicar em “App Cliente” ou “Motorista” na Central de Acessos, o sistema abre a rota correta no mesmo ambiente atual e deixa de exibir o erro persistente de “Marca não encontrada”.

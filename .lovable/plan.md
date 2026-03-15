

## Problema

O link "Landing Parceiros" no sidebar aponta para `/parceiro`, mas a rota requer um slug de marca: `/:slug/parceiro`. Como o root admin gerencia múltiplas marcas, não há uma marca fixa para usar no link.

## Solução

Buscar a lista de marcas ativas e, se houver apenas uma, usar seu slug diretamente. Se houver múltiplas, mostrar um dropdown/select para o admin escolher qual landing de parceiro abrir.

**Abordagem simplificada**: Buscar todas as marcas com uma query leve no `RootSidebar` e transformar o item "Landing Parceiros" em um submenu com uma entrada por marca (cada uma abrindo `/${brand.slug}/parceiro` em nova aba).

## Mudanças

| Arquivo | Ação |
|---|---|
| `src/components/consoles/RootSidebar.tsx` | Buscar marcas ativas via query, substituir o link fixo de parceiros por um submenu listando cada marca com seu slug correto |

### Detalhes técnicos

1. Adicionar `useQuery` para buscar `brands` (apenas `id`, `name`, `slug` onde `is_active = true`)
2. Substituir o `<a>` fixo de "Landing Parceiros" por um `Collapsible` ou lista inline com um link por marca: `${origin}/${brand.slug}/parceiro`
3. Cada link mantém `target="_blank"`, ícone `ExternalLink` e badge "Externo"
4. Se houver apenas 1 marca, manter como link direto sem submenu


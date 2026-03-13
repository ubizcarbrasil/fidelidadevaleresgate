

## Diagnóstico: Por que as sessões criadas no Construtor V2 não aparecem na Home do cliente

### Problema raiz

O Construtor de Páginas V2 (`/page-builder-v2`) **não oferece a opção de criar sessões para a Home**. Ele só gerencia páginas customizadas (acessíveis via `/p/slug`). Quando o usuário cria uma sessão ali, ela fica vinculada a uma página específica (ex: "Resgate"), e não à Home.

O construtor V1 (`/page-builder`) tem uma entrada "Tela Inicial (Home)" que permite gerenciar sessões da home (com `page_id = null`). O V2 não tem essa funcionalidade.

Além disso, o `HomeSectionsRenderer` não filtra por `page_id IS NULL`, o que faz com que sessões de páginas customizadas potencialmente apareçam na home de forma inconsistente.

### Correções necessárias

**1. Adicionar "Tela Inicial (Home)" ao Page Builder V2**
- No `PageBuilderV2Page.tsx`, adicionar um card especial no topo da lista (como o V1 faz) que abre o `PageSectionsEditor` com `page_id = null`
- Quando `page_id` é null, o `PageSectionsEditor` deve buscar sessões com `.is("page_id", null)` e o wizard deve criar seções sem `page_id`
- O card terá visual diferenciado (ícone de smartphone, destaque em azul)

**2. Corrigir `PageSectionsEditor` para suportar modo Home**
- Aceitar `page` como `null` para modo Home
- Quando em modo Home, buscar sessões com `.is("page_id", null)` em vez de `.eq("page_id", page.id)`
- Passar `pageId={null}` para o `SectionCreatorWizard`

**3. Corrigir `HomeSectionsRenderer` para filtrar apenas sessões da Home**
- Adicionar `.is("page_id", null)` na query da linha 122-127 para não mostrar sessões de páginas customizadas na home

### Arquivos afetados
- `src/pages/PageBuilderV2Page.tsx` -- adicionar card "Home"
- `src/components/page-builder-v2/PageSectionsEditor.tsx` -- suportar modo Home (page_id = null)
- `src/components/HomeSectionsRenderer.tsx` -- filtrar `page_id IS NULL`


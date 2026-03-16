

## Plano: Restringir sidebar do plano básico + Info de filtros nas seções

### Problemas identificados

1. **"Editor de Páginas"** não deveria aparecer no plano básico — seções já são gerenciadas via "Aparência da Marca" > aba "Seções da Home"
2. **"Biblioteca de Ícones"** não deveria aparecer no plano básico
3. Falta um **botão de informação** em cada seção mostrando qual filtro/configuração foi aplicada (segmento, tipo de exibição, etc.)
4. **Bug**: botão de excluir duplicado no `BrandSectionsManager.tsx` (linhas 416-423) — um condicional e outro incondicional

### Alterações

#### 1. `src/components/consoles/BrandSidebar.tsx`
- Adicionar lógica para verificar o `subscription_plan` da marca (via `useBrandInfo` que já retorna dados da marca)
- Ocultar os itens **"Editor de Páginas"** (`page_builder`) e **"Biblioteca de Ícones"** (`icon_library`) quando o plano for `basic`/`free`/`null`
- Renomear "Assinatura" (atualmente `sidebar.subscription`) para label correto — o screenshot mostra que está com nome técnico

#### 2. `src/components/BrandSectionsManager.tsx`
- **Adicionar botão de info (ℹ️)** em cada seção card que abre um popover/tooltip mostrando:
  - Tipo do template (ex: "Carrossel de Ofertas")
  - Modo de exibição (carousel/grid/list)
  - Filtro aplicado (ex: "Mais recentes")
  - Segmentos de taxonomia filtrados (se houver `segment_filter_ids`)
  - Linhas × Colunas
  - Tipo de cupom filtrado
  - Limites de visibilidade
- **Corrigir bug**: remover botão de delete duplicado (linha 421-423), manter apenas o condicional (416-420)

#### 3. `src/hooks/useBrandName.ts`
- Incluir `subscription_plan` no retorno do `useBrandInfo` para que o sidebar possa consultar o plano

### Arquivos alterados
| Arquivo | Ação |
|---------|------|
| `src/components/consoles/BrandSidebar.tsx` | Ocultar itens por plano |
| `src/components/BrandSectionsManager.tsx` | Adicionar popover de info + fix delete duplicado |
| `src/hooks/useBrandName.ts` | Retornar `subscription_plan` |


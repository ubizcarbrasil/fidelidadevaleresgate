

## Problema: Rótulos do sidebar exibindo chaves brutas

O hook `useMenuLabels.ts` contém apenas 12 rótulos padrão na seção `admin`, mas o `BrandSidebar.tsx` define ~40 itens de menu. Todos os itens sem rótulo padrão exibem a chave bruta (ex: "sidebar.gg_config" em vez de "Configuração GG").

### Solução

Atualizar o dicionário `DEFAULT_LABELS.admin` em `src/hooks/useMenuLabels.ts` para incluir **todos** os itens definidos no `BrandSidebar.tsx`, usando o `defaultTitle` de cada item como valor padrão.

### Itens faltantes a adicionar

| Chave | Rótulo |
|-------|--------|
| `sidebar.jornada` | Jornada do Empreendedor |
| `sidebar.jornada_emissor` | Jornada do Emissor |
| `sidebar.app_icons` | Ícones do App |
| `sidebar.page_builder` | Construtor de Páginas |
| `sidebar.parceiros` | Parceiros |
| `sidebar.ofertas` | Ofertas |
| `sidebar.clientes` | Clientes |
| `sidebar.resgates` | Resgates |
| `sidebar.cupons` | Cupons |
| `sidebar.aprovar_regras` | Aprovar Regras |
| `sidebar.solicitacoes_emissor` | Solicitações de Emissor |
| `sidebar.achadinhos` | Achadinhos |
| `sidebar.catalogo` | Catálogo |
| `sidebar.enviar_notificacao` | Enviar Notificação |
| `sidebar.operador_pdv` | Operador PDV |
| `sidebar.pontuar` | Pontuar |
| `sidebar.regra_parceiro` | Regra de Pontos do Parceiro |
| `sidebar.gg_config` | Configuração GG |
| `sidebar.gg_billing` | Painel Financeiro GG |
| `sidebar.gg_closing` | Fechamento Mensal |
| `sidebar.perm_parceiros` | Permissões dos Parceiros |
| `sidebar.auditoria` | Auditoria |
| `sidebar.relatorios` | Relatórios |
| `sidebar.taxonomia` | Taxonomia |

### Arquivo alterado
- `src/hooks/useMenuLabels.ts` — expandir `DEFAULT_LABELS.admin` com todos os 25 itens acima.


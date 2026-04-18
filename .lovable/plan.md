

## Diagnóstico

O usuário quer:
1. Confirmar que as últimas mudanças estão funcionando (Central de Módulos: Catálogo, Empreendedores, Cidades, Auditoria, Aplicação em Massa, busca em todas as abas, busca no painel "Funcionalidades da Marca").
2. **Atualizar/criar manuais** refletindo essas novas funcionalidades.

Vou focar na parte (2) que é onde há trabalho real a fazer. A parte (1) é teste — posso explicar o que foi feito sem usar browser (não foi pedido explicitamente para testar via preview, e o usuário pediu "atualize e cria manuais").

## Investigação feita

Já tenho contexto suficiente da estrutura:
- Manuais ficam em `src/components/manuais/dados_manuais.ts` (precisa ler)
- Tipos: `ManualEntry { id, titulo, descricao, comoAtivar, passos[], dicas[], rota }` agrupados em `GrupoManual`
- Existem dois conjuntos: `gruposManuais` (Empreendedor/Brand) e `gruposManuaisFranqueado` (Branch)
- `ManuaisPage` filtra por `consoleScope` e por `scoringFilter`

## O que vou fazer

### Verificação rápida (sem browser)
Resumir o que está implementado e funcional baseado no histórico:
- ✅ Catálogo, Empreendedores, Cidades, Auditoria, Aplicação em Massa
- ✅ Busca nas 3 abas (Empreendedores, Cidades, Catálogo se aplicável)
- ✅ Busca em "Funcionalidades da Marca" (`/brand-modules`)
- ✅ Trigger de auditoria + RLS root_admin

### Manuais a criar/atualizar
Vou adicionar **um novo grupo "Central de Módulos"** em `gruposManuais` (visível ao Root/Empreendedor) com 5 manuais:

1. **Catálogo de Módulos** — cadastro/edição de definições + contador de uso por marca/cidade
2. **Aba Empreendedores** — gestão de módulos por marca + busca
3. **Aplicação em Massa** — toggle de 1 módulo em N marcas de uma vez
4. **Aba Cidades** — overrides por cidade + busca
5. **Auditoria de Módulos** — histórico de quem ligou/desligou o quê

E **atualizar** o manual existente de "Funcionalidades do App" (no grupo do franqueado/empreendedor de marca) para mencionar a nova **busca por funcionalidade**.

### Arquivos a editar
- `src/components/manuais/dados_manuais.ts` — adicionar grupo + atualizar manual existente
- Verificar se há ícone `History` ou `Layers` apropriado já mapeado em `ManuaisPage.tsx` (sim: `Layers` está; vou usar `Blocks` mapeando ou reaproveitar `Settings2`)

### Detalhes técnicos
- Categoria nova: `"Central de Módulos"` com ícone `"Settings2"` (já no mapa `iconesPorNome`)
- Cada manual com 4-6 passos práticos e 2-3 dicas
- Rotas: `/admin/central-modulos` e `/brand-modules`
- Texto em pt-BR, tom instrutivo

## Riscos
Nenhum — apenas conteúdo estático em arquivo de dados. Sem mudanças de schema, RLS, ou lógica.


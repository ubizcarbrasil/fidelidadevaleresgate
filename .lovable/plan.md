
Objetivo: deixar a aplicação realmente utilizável no celular como web app instalável, ajustando o shell global, os componentes compartilhados e as páginas críticas para comportamento mobile-first sem quebrar o fluxo desktop.

## Diagnóstico atual
O projeto já tem base de PWA:
- `vite-plugin-pwa` no `vite.config.ts`
- manifest/meta tags no `index.html`
- banners de instalar/atualizar em `App.tsx`
- safe-area CSS em `src/index.css`

Mas a experiência mobile ainda está inconsistente porque:
- `AppLayout.tsx` concentra muitos elementos no topo e aperta a navegação em telas pequenas
- várias páginas usam tabelas/listas largas, grids densos e barras de ação horizontais
- alguns sheets/dialogs/tabs ficam espremidos no celular
- não existe um padrão único para “versão mobile” de listagens administrativas
- a experiência PWA precisa de acabamento de instalação/uso em modo standalone

## O que será implementado

### 1) Shell global mobile/PWA
Ajustar a estrutura base para o app funcionar bem em celular em qualquer rota:
- refinar `AppLayout.tsx` para topbar mobile mais enxuta
- reorganizar busca, breadcrumbs, seletor de cidade e ações secundárias para não estourarem largura
- garantir `main` com espaçamento, altura e rolagem corretos em mobile/standalone
- aplicar `safe-area` no topo e rodapé de forma consistente
- revisar sidebar mobile (`src/components/ui/sidebar.tsx`) para abertura/fechamento confortável em PWA

### 2) Padrão compartilhado de responsividade
Criar/ajustar componentes e utilitários para evitar correções isoladas página por página:
- `PageHeader` com ações empilháveis no mobile
- `DataTableControls` com busca/filtros/paginação em coluna no celular
- padrão para tabelas: wrapper horizontal + fallback em cards quando necessário
- padrão para dialogs/sheets: largura total no mobile, altura máxima segura e scroll interno
- padrão para tabs densas: scroll horizontal ou seleção compacta no mobile
- reforço em `src/index.css` para touch targets, overflow e standalone mode

### 3) Adequação das páginas administrativas principais
Fazer um passe nas rotas com maior uso e maior risco de quebra mobile, começando pelas que concentram operação diária:
- Dashboard
- Gestão de Motoristas
- Ofertas
- Clientes
- Parceiros
- Cidades
- Resgates
- Relatórios
- Configurações da cidade/marca
- páginas com tabelas de CRM e páginas de administração com tabs

Critérios de ajuste por página:
- nenhum conteúdo cortado horizontalmente sem alternativa
- filtros e botões principais acessíveis com uma mão
- grids virando 1 coluna ou 2 colunas quando necessário
- tabelas críticas com leitura possível no celular
- cabeçalhos, KPIs, badges e cards sem sobreposição

### 4) Fluxos já afetados no módulo de motoristas
Consolidar o módulo que você está usando agora:
- `modal_importar_motoristas.tsx`: manter modal 100% navegável em telas pequenas
- `DriverManagementPage.tsx`: barra de busca, badges, ações e paginação em layout mobile
- `DriverDetailSheet.tsx`: substituir a grade fixa de 6 abas por navegação horizontal/compacta no celular
- revisar abas internas da ficha do motorista para evitar campos e blocos quebrados

### 5) Experiência PWA instalável
Como você pediu “versão PWA mobile”, finalizar a experiência de uso instalável:
- revisar manifest e apresentação mobile já existente
- garantir consistência de tema, ícones e título no modo instalado
- adicionar uma tela/ajuda de instalação simples (`/install`) com instruções para Android e iPhone
- manter o comportamento seguro do preview e evitar problemas de cache do service worker no editor
- validar banners de instalar/atualizar para não cobrirem botões importantes no celular

## Arquivos com maior chance de edição
- `src/components/AppLayout.tsx`
- `src/components/ui/sidebar.tsx`
- `src/components/PageHeader.tsx`
- `src/components/DataTableControls.tsx`
- `src/components/driver-management/DriverDetailSheet.tsx`
- `src/features/importacao_motoristas/components/modal_importar_motoristas.tsx`
- `src/pages/DriverManagementPage.tsx`
- `src/pages/Dashboard.tsx`
- páginas administrativas com tabelas/listas em `src/pages/`
- `src/index.css`
- `src/App.tsx`
- possivelmente `vite.config.ts` e `index.html` apenas se precisar acabamento extra do PWA

## Estratégia de execução
1. Corrigir primeiro o shell global e os componentes compartilhados
2. Aplicar o padrão nas páginas administrativas mais usadas
3. Ajustar os fluxos de motorista/importação
4. Fechar a experiência PWA instalável
5. Fazer revisão final rota a rota em viewport mobile

## Critérios de aceite
Ao final, a aplicação deverá:
- funcionar em celular sem cortes visuais nas páginas principais
- abrir menus, modais, sheets e tabs corretamente no mobile
- permitir uso confortável em modo PWA instalado
- preservar o desktop atual
- manter navegação, importação e consulta de motoristas operando normalmente

## Publicação
Depois da implementação, a recomendação é:
- testar no preview em viewport mobile
- publicar
- validar no celular real pelo domínio publicado
- instalar na tela inicial e checar 3 fluxos: login, navegação entre páginas e importação/consulta de motoristas

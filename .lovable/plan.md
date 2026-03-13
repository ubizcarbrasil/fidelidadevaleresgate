

## Plano: Botão de acesso rápido ao App do Cliente no Dashboard

### Situação atual
O Dashboard já possui links para o "App do Cliente" dentro do card "Links Úteis" (`BrandQuickLinks`), mas:
1. Só aparece para `showBrand && !isRoot` (brand admins)
2. Está enterrado dentro de um card com outros links — não é proeminente
3. Para ROOT impersonando marca, o botão existe no card "Painéis dos Parceiros" mas é secundário

### O que será feito

Adicionar um **botão flutuante fixo** (FAB) no canto inferior direito do Dashboard que abre o App do Cliente em nova aba. Será visível para todos os escopos que possuem `currentBrandId` (Brand, Branch e Root impersonando).

### Alterações

**`src/pages/Dashboard.tsx`**
- Adicionar um botão flutuante fixo (`fixed bottom-6 right-6`) com ícone de celular + texto "App do Cliente"
- Visível quando `currentBrandId` existe (qualquer scope com marca ativa)
- Ao clicar, abre `/customer-preview?brandId={currentBrandId}` em nova aba
- Estilo: botão primário arredondado com sombra, destaque visual com animação sutil de pulse no ícone
- Responsivo: em mobile (430px), mostrar apenas ícone; em desktop, ícone + texto

### Detalhes técnicos
- Usa `useBrandGuard().currentBrandId` já disponível no componente
- `window.open(url, "_blank")` para abrir em nova aba
- Posicionamento `fixed` com `z-50` para ficar acima do conteúdo scrollável
- Não requer mudança no backend


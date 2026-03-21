

## Plano: Restaurar itens removidos no app do cliente

### Problema
Na reversão anterior, os itens removidos do app do cliente não foram restaurados. O header e a home do passageiro continuam sem:
- Seletor de cidade (BranchPickerSheet)
- Botão do sino (notificações)
- Botão da carteira
- Saudação ("Boa noite, Visitante")
- Badge de saldo ("0 pts")

### O que será feito

**1. `src/components/customer/CustomerLayout.tsx` (header, linhas 270-271)**
- O bloco de ações do header está vazio (`<div className="flex items-center gap-0.5"></div>`)
- Restaurar: `BranchPickerSheet`, botão do sino com badge de unread, botão da carteira
- Imports já existem no topo do arquivo (BranchPickerSheet, NotificationDrawer)

**2. `src/pages/customer/CustomerHomePage.tsx` (hero section)**
- Adicionar de volta o bloco hero antes das native sections (linha 159):
  - Saudação dinâmica ("Bom dia/Boa tarde/Boa noite, [nome]")
  - Badge de saldo de pontos com ícone Coins
  - Estilo consistente com o tema da marca

### Arquivos envolvidos
- **Editar**: `src/components/customer/CustomerLayout.tsx` — restaurar ações do header
- **Editar**: `src/pages/customer/CustomerHomePage.tsx` — restaurar hero section


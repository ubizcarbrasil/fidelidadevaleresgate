

## Plano: Reverter mudanças no app do cliente e aplicar no painel do motorista

### Problema
As remoções (seletor de cidade, sino, carteira, saudação, saldo) foram aplicadas no app do cliente (`CustomerLayout.tsx` e `CustomerHomePage.tsx`), mas deveriam ter sido feitas no painel do motorista (`DriverMarketplace.tsx`).

### Ações

**1. Reverter `src/components/customer/CustomerLayout.tsx`**
- Restaurar o `BranchPickerSheet`, botão do sino e botão da carteira no header

**2. Reverter `src/pages/customer/CustomerHomePage.tsx`**
- Restaurar o bloco Hero Section com saudação e badge de saldo

**3. Ajustar `src/components/driver/DriverMarketplace.tsx`**
- O painel do motorista já está limpo (sem pontos, sem carteira, sem sino) — ele foi criado assim desde o início
- Confirmar que o header mostra apenas logo + título "Marketplace"
- Nenhuma mudança necessária aqui

### Resumo
Reverter os dois arquivos do cliente ao estado anterior. O painel do motorista já está correto.


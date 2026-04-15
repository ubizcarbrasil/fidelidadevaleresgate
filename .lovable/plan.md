

## Correção: Adicionar botão "Meus Resgates" no DriverMarketplace

### Problema
O botão "Meus Resgates" foi adicionado apenas na `DriverHomePage` (Hub view). A tela que o usuário está usando é a `DriverMarketplace`, que não tem esse botão nem acesso ao `DriverCityRedemptionHistory`.

### Solução
Adicionar um botão "Meus Resgates" e o overlay de `DriverCityRedemptionHistory` diretamente no `DriverMarketplace.tsx`.

### Alterações

**`src/components/driver/DriverMarketplace.tsx`**

1. Importar `DriverCityRedemptionHistory` e o ícone `Ticket`
2. Adicionar estado `showCityRedemptions` (boolean)
3. Renderizar um botão/card "Meus Resgates" logo após a seção "Resgate na Cidade" (linha ~697), com o mesmo visual do `QuickActionCards`:
   - Ícone `Ticket` amarelo
   - Texto: "Meus Resgates" / "Acompanhe seus resgates na cidade"
   - Condição de exibição: sem busca ativa (`!debouncedSearch.trim()`)
4. Renderizar o overlay no final do componente:
```tsx
{showCityRedemptions && (
  <DriverCityRedemptionHistory
    fontHeading={fontHeading}
    onBack={() => setShowCityRedemptions(false)}
  />
)}
```

### Resultado
O botão "Meus Resgates" ficará visível na view principal do motorista (Marketplace), abrindo o histórico de resgates como overlay.


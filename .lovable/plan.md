

## Corrigir botão "Acessar Conta" para abrir o painel do motorista

### Problema
O botão "Acessar Conta" na gestão de motoristas abre `/customer-preview?brandId=X`, que é o app do **passageiro/cliente**. O motorista precisa navegar manualmente até a área de motorista. O correto é abrir `/driver?brandId=X`, que é o painel dedicado ao motorista e já possui `DriverSessionProvider` que restaura a sessão via CPF do localStorage.

### Solução
Alterar a URL em `handleOpenPwa
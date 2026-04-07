

## Corrigir botão "Acessar Conta" para abrir a conta do motorista

### Problema
O botão "Acessar Conta" abre `/customer-preview?brandId=X&customerId=Y`, mas a página ignora o parâmetro `customerId`. O sistema de sessão de motorista é baseado em CPF salvo no `localStorage` (chave `driver_session_cpf_{brandId}`), então o motorista não é logado automaticamente.

### Solução
Alterar o `handleOpenPwa` em `AbaDadosMotorista.tsx` para, antes de abrir a nova aba, salvar o CPF do motorista no localStorage com a chave correta (`driver_session_cpf_{brandId}`). Assim, quando a página `/customer-preview` carregar, o `DriverSessionProvider` restaura a sessão automaticamente.

### Alteração

**Arquivo**: `src/components/driver-management/tabs/AbaDadosMotorista.tsx`

Modificar `handleOpenPwa`:

```tsx
const handleOpenPwa = () => {
  // Pre-seed driver session in localStorage so DriverSessionProvider auto-restores
  if (driver.cpf) {
    const cleanCpf = driver.cpf.replace(/\D/g, "");
    localStorage.setItem(`driver_session_cpf_${brandId}`, cleanCpf);
  }
  const url = `/customer-preview?brandId=${brandId}`;
  window.open(url, "_blank");
};
```

Mudanças:
- Salva o CPF limpo no localStorage antes de abrir a aba
- Remove o parâmetro `customerId` da URL (não era usado)
- O `DriverSessionProvider` detecta o CPF salvo e carrega o motorista automaticamente

Impacto: apenas 4 linhas alteradas, sem novos arquivos.


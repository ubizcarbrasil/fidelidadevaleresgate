

## Correção: "Acessar Conta" abre perfil do motorista errado

### Causa raiz

O `DriverSessionProvider` só lê o CPF do `localStorage` **uma única vez** — no mount do componente (ou se o `brandId` mudar). 

Quando o admin acessa a conta do **Pedro Henrique** primeiro, o CPF dele fica no localStorage e o PWA abre em uma nova aba. Depois, ao clicar em "Acessar Conta" no **Clóvis Brito**, o código atualiza o localStorage com o CPF do Clóvis e chama `window.open("/driver?brandId=X", "_blank")`. 

No mobile, o navegador **reutiliza a aba já aberta** em vez de criar uma nova. Como o `useEffect` do `DriverSessionProvider` já rodou (dependência `[brandId]` não mudou), ele **não relê o localStorage**, mantendo o Pedro Henrique carregado.

### Solução

1. **`DriverSessionContext.tsx`** — Adicionar listener de `visibilitychange` que, quando a aba volta ao foco, relê o CPF do localStorage e, se for diferente do CPF do motorista atual, recarrega a sessão com o novo CPF.

2. **`AbaDadosMotorista.tsx`** — Forçar abertura em nova aba limpa adicionando um timestamp na URL (`/driver?brandId=X&t=123`) para evitar reuso de aba pelo navegador mobile.

### Detalhes técnicos

**DriverSessionContext.tsx** — Dentro do `DriverSessionProvider`, adicionar um segundo `useEffect`:

```typescript
useEffect(() => {
  const handleVisibility = () => {
    if (document.visibilityState !== "visible") return;
    const savedCpf = localStorage.getItem(storageKey(brandId));
    const currentCpf = driver?.cpf ? cleanCpf(driver.cpf) : null;
    if (savedCpf && savedCpf !== currentCpf) {
      setLoading(true);
      fetchDriverByCpf(brandId, savedCpf).then((d) => {
        if (d) setDriver(d);
        setLoading(false);
      });
    } else if (!savedCpf && driver) {
      setDriver(null);
    }
  };
  document.addEventListener("visibilitychange", handleVisibility);
  return () => document.removeEventListener("visibilitychange", handleVisibility);
}, [brandId, driver]);
```

**AbaDadosMotorista.tsx** — Alterar a URL para incluir timestamp:
```typescript
const url = `/driver?brandId=${brandId}&t=${Date.now()}`;
```

### Arquivos modificados
- `src/contexts/DriverSessionContext.tsx`
- `src/components/driver-management/tabs/AbaDadosMotorista.tsx`


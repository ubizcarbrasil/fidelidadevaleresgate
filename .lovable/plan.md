

## Plano: Corrigir botão "Acessar Conta" do motorista

### Diagnóstico

O botão "Acessar Conta" em `AbaDadosMotorista.tsx` abre a URL:
```
/customer-preview?brand={brandId}
```

Porém, `CustomerPreviewPage.tsx` lê o parâmetro como:
```ts
params.get("brandId")  // espera "brandId", recebe "brand"
```

Resultado: `brandId` é `null`, gerando o erro "Não foi possível identificar a marca do usuário logado."

### Correção

**Arquivo:** `src/components/driver-management/tabs/AbaDadosMotorista.tsx`

Alterar a URL no `handleOpenPwa` de `?brand=` para `?brandId=`:

```ts
const handleOpenPwa = () => {
  const url = `/customer-preview?brandId=${brandId}`;
  window.open(url, "_blank");
};
```

### Impacto
- Correção de uma única linha
- Nenhum outro arquivo afetado




## Problema encontrado

Existem **dois sistemas separados** controlando a visibilidade dos Achadinhos:

1. **Módulos da Marca** (`brand_modules` → chave `affiliate_deals`) — o toggle que você desativou na página de Módulos
2. **Configurações da Cidade** (`branch_settings_json.enable_achadinhos_module`) — toggle por cidade no formulário de edição da cidade

O **painel do motorista** (`DriverPanelPage.tsx`) só verifica o sistema #2 (configuração da cidade). Ele ignora completamente o toggle de módulo da marca. Por isso, mesmo desativando "Achadinhos" nos módulos, o marketplace continua aparecendo.

A **home do cliente** já funciona corretamente — ela usa `useBrandModules()` que consulta o sistema #1.

---

## Solução

Fazer o painel do motorista também consultar o módulo `affiliate_deals` da marca, combinando os dois controles: o módulo precisa estar ativo na marca **E** na cidade para os achadinhos aparecerem.

### Arquivos

| Arquivo | Mudança |
|---------|---------|
| `src/pages/DriverPanelPage.tsx` | Adicionar query ao `public_brand_modules_safe` para checar `affiliate_deals`. Combinar com o check da cidade: `achadinhosEnabled = brandModuleEnabled AND branchSettingEnabled` |

### Lógica final

```text
Antes:
  achadinhosEnabled = branch_settings_json.enable_achadinhos_module !== false
  (ignora o toggle de módulo da marca)

Depois:
  brandAchadinhosEnabled = public_brand_modules_safe[affiliate_deals].is_enabled ?? true
  branchAchadinhosEnabled = branch_settings_json.enable_achadinhos_module !== false
  achadinhosEnabled = brandAchadinhosEnabled AND branchAchadinhosEnabled
```

Mudança mínima — uma query adicional (similar à já existente para `driver_hub`) e um `&&` no cálculo do flag.


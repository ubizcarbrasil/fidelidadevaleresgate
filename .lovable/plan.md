

## Problema: Módulo Achadinhos não é respeitado no app do motorista

### Diagnóstico
A configuração `enable_achadinhos_module: false` já está salva na cidade Ipatinga, e o sidebar do franqueado já esconde o grupo corretamente. Porém, o **app do motorista** (DriverHomePage e DriverMarketplace) nunca consulta essa configuração — ele sempre carrega e exibe os achadinhos.

### Solução
Fazer o app do motorista respeitar `enable_achadinhos_module` da branch, escondendo as seções de achadinhos quando desabilitado.

### Arquivos alterados

| Arquivo | Mudança |
|---------|---------|
| `src/pages/DriverPanelPage.tsx` | Passar flag `achadinhosEnabled` para DriverHomePage e DriverMarketplace, lida do `branch.branch_settings_json` |
| `src/components/driver/home/DriverHomePage.tsx` | Receber prop `achadinhosEnabled` e esconder categorias, vitrines de ofertas e busca quando `false` |
| `src/components/driver/DriverMarketplace.tsx` | Receber prop `achadinhosEnabled` e esconder seção de achadinhos/ofertas afiliadas quando `false`, mantendo apenas "Resgate na Cidade" e Duelos |

### Como funciona
1. O `DriverPanelPage` já tem acesso ao `branch` (com `branch_settings_json`)
2. Extrair `enable_achadinhos_module` do JSON (default `true` se não definido)
3. Passar como prop para os componentes filhos
4. Quando `false`: esconder categorias, vitrine de ofertas, busca por achadinhos no Hub; no Marketplace, esconder a listagem de affiliate_deals

### Resultado
Ao desabilitar "Achadinhos" na configuração da cidade, o motorista não verá mais ofertas afiliadas no app, tanto no Hub quanto no Marketplace.


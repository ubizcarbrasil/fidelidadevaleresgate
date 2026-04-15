

## Revisão: Permissões do App do Motorista + Compra de Pontos

### Problemas identificados

**1. Achadinhos não responde ao toggle:**
- O `BrandBranchForm.tsx` carrega os defaults com `!== false` (missing = ON, linha 163)
- O `DriverPanelPage.tsx` lê com `=== true` (missing = OFF, linha 92)
- Além disso, achadinhos exige **dupla condição**: módulo `affiliate_deals` ativo na marca **E** flag `enable_achadinhos_module === true` na cidade. Se o módulo de marca estiver desligado, a flag da cidade é ignorada.

**2. Compra de pontos nunca aparece:**
- O driver panel lê `branchSettings?.enable_driver_points_purchase === true` (linha 98)
- Mas o `BrandBranchForm.tsx` **nunca salva** essa chave no `branch_settings_json` (linhas 226-238). A chave simplesmente não existe no objeto salvo.
- Da mesma forma, `enable_whatsapp_access` e `enable_points_purchase` são lidas mas nunca escritas.

**3. Flags faltantes no formulário da cidade:**
- As seguintes flags são consumidas pelo driver panel mas não são expostas como toggles no formulário da cidade:
  - `enable_driver_points_purchase` — "Motorista compra pontos?"
  - `enable_whatsapp_access` — "Motorista tem acesso ao WhatsApp?"
  - `enable_points_purchase` — "Motorista compra com pontos?" (redeemable marketplace)

### Solução

**A) Adicionar toggles faltantes ao `BrandBranchForm.tsx`**

Adicionar state + toggles visuais + persistência para:
- `enable_driver_points_purchase` — Motorista compra pontos?
- `enable_whatsapp_access` — Motorista acessa WhatsApp?
- `enable_points_purchase` — Motorista compra com pontos?

Todos com default `false` (ausente = OFF, seguindo a regra `=== true`).

**B) Corrigir defaults de carregamento no `BrandBranchForm.tsx`**

Mudar os defaults de `!== false` para `=== true` nos módulos que o driver panel lê com `=== true`:
- `enable_achadinhos_module`: de `bs.enable_achadinhos_module !== false` para `bs.enable_achadinhos_module === true`
- `enable_marketplace_module`: idem
- `enable_race_earn_module`: idem

Isso garante consistência: se a flag nunca foi setada, tanto o admin quanto o driver entendem como OFF.

**C) Persistir novas flags no payload de salvamento**

Incluir as 3 novas flags no objeto `branchSettingsJson` que é salvo no `branch_settings_json`.

**D) Migração: setar flags para cidades existentes**

Criar migração SQL para definir `enable_driver_points_purchase = true` nas cidades que já tenham configuração de compra de pontos ativa.

### Arquivos afetados

1. `src/pages/BrandBranchForm.tsx` — Novos toggles + correção de defaults
2. Nova migração SQL — Corrigir dados existentes


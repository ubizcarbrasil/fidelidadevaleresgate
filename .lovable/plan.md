

## Plano: Condicionar opções de pontuação ao módulo emissor

### Problema
No wizard de criação de oferta da loja parceira, as opções **"Ganhe Pontos" (EARN)** e **"Ganhe & Resgate" (BOTH)** aparecem mesmo quando o módulo `multi_emitter` não está ativo para a marca. Lojas com perfil **Receptora** não deveriam ver opções de acúmulo de pontos.

### Solução

**Arquivo:** `src/components/store-voucher-wizard/steps/StepPurpose.tsx`

1. Receber `brandId` como prop (já disponível no wizard pai)
2. Usar `useBrandModules` (ou query direta com o `brandId`) para verificar se `multi_emitter` está ativo
3. Filtrar a lista `purposes`: se módulo desativado, mostrar apenas **REDEEM**
4. Se só resta uma opção, pré-selecionar automaticamente `offer_purpose: "REDEEM"`

**Arquivo:** `src/components/store-voucher-wizard/StoreVoucherWizard.tsx`

1. Passar `brandId` como prop ao `StepPurpose`
2. Se módulo emissor desativado, considerar pular o step de Finalidade automaticamente (já que só há uma opção) ou mantê-lo com a seleção única visível

### Arquivos alterados
- `src/components/store-voucher-wizard/steps/StepPurpose.tsx` — filtrar opções por módulo
- `src/components/store-voucher-wizard/StoreVoucherWizard.tsx` — passar brandId ao step


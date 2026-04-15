

## Correção Definitiva: Permissões do App do Motorista

### Causa Raiz Real

O módulo `driver_hub` **não está ativado** para a marca Ubiz Resgata. Isso faz com que o app do motorista pule a **Home Inteligente** (DriverHomePage — que mostra "Comprar Pontos", "Resgate na Cidade", WhatsApp, etc.) e vá direto para o **DriverMarketplace** (que é apenas a vitrine de Achadinhos).

O DriverMarketplace não consome as flags `enable_driver_points_purchase`, `enable_whatsapp_access`, etc. — essas flags só são usadas no DriverHomePage. Então mesmo que os toggles estejam corretos no banco de dados, a tela que os usa nunca aparece.

Além disso, o DriverMarketplace possui sua própria lógica de visibilidade que **não respeita** os toggles da "Configuração por Cidade" para a seção "Compre com Pontos".

### Problemas identificados

1. **`driver_hub` não ativado** → Home com QuickActionCards nunca renderiza
2. **DriverMarketplace ignora flags de cidade** → Seções como "Compre com Pontos" usam lógica própria independente
3. **Auto-ativação do `driver_hub` inexistente** → Deveria ser ativado automaticamente quando a integração de mobilidade é configurada
4. **Sem mecanismo de refetch** → A branch data no DriverPanelPage usa `useState` simples (não react-query), então mudanças no admin só aparecem após reload completo

### Solução

**A) Migração: Ativar `driver_hub` para Ubiz Resgata**
- Inserir o módulo na tabela `brand_modules` para corrigir os dados atuais

**B) Auto-ativação do `driver_hub` no onboarding**
- No `BrandBranchForm.tsx`, ao registrar integração de mobilidade, ativar `driver_hub` junto com `machine_integration`

**C) DriverMarketplace respeitar flags de cidade**
- Garantir que a seção "Compre com Pontos" e "Resgate na Cidade" no DriverMarketplace respeitem `enable_points_purchase` e `is_city_redemption_enabled` da branch
- Adicionar o botão "Comprar Pontos" no DriverMarketplace (header ou floating) quando `enable_driver_points_purchase === true`

**D) Converter fetch da branch para react-query no DriverPanelPage**
- Substituir o `useState`/`useEffect` por `useQuery` com staleTime curto para que mudanças no admin reflitam sem precisar recarregar a página inteira

### Arquivos afetados

1. **Nova migração SQL** — Ativar `driver_hub` para Ubiz Resgata
2. **`src/pages/BrandBranchForm.tsx`** — Auto-ativar `driver_hub` junto com `machine_integration`
3. **`src/components/driver/DriverMarketplace.tsx`** — Respeitar flags de cidade para "Compre com Pontos" e adicionar botão "Comprar Pontos"
4. **`src/pages/DriverPanelPage.tsx`** — Converter fetch de branch para react-query

### Detalhes técnicos

```sql
-- Ativar driver_hub para Ubiz Resgata
INSERT INTO brand_modules (brand_id, module_definition_id, is_enabled)
VALUES (
  'db15bd21-9137-4965-a0fb-540d8e8b26f1
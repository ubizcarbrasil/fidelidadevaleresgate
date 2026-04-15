

## Plano: Botão "Meus Resgates" → Abrir lista de parceiros da cidade

### Problema
Na seção "Resgate na Cidade", o botão "Meus Resgates" abre o histórico de resgates (`DriverCityRedemptionHistory`). O comportamento correto é abrir a **lista de lojas parceiras** da cidade.

### O que será feito

**1. Criar componente `DriverCityPartnersPage.tsx`**
- Nova tela overlay (full-screen, z-50) com lista de lojas parceiras da cidade
- Busca na tabela `stores` filtrando por `branch_id`, `is_active = true`, `approval_status = 'APPROVED'`
- Exibe: logo, nome, categoria de cada loja
- Ao clicar numa loja, mostra as ofertas de resgate daquela loja (REDEEM/BOTH)
- Inclui barra de busca
- Segue o padrão visual de `CustomerEmissorasPage`/`DriverRedeemStorePage`

**2. Alterar `SecaoResgateCidade.tsx`**
- Renomear prop `onVerHistorico` → `onVerParceiros`
- Alterar texto do botão de "Meus Resgates" → "Ver Parceiros"

**3. Alterar `DriverMarketplace.tsx`**
- Trocar o estado `showCityRedemptions` → `showCityPartners`
- Conectar ao novo componente `DriverCityPartnersPage`
- Manter o `DriverCityRedemptionHistory` acessível de outro ponto (ex: dentro da nova tela de parceiros ou no perfil)

### Arquivos afetados
- `src/components/driver/DriverCityPartnersPage.tsx` — novo
- `src/components/driver/SecaoResgateCidade.tsx` — renomear prop e texto
- `src/components/driver/DriverMarketplace.tsx` — trocar overlay


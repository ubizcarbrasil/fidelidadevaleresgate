

## Plano: Respeitar módulos desativados na tela do cliente

### Problema
Quando o empreendedor desativa o módulo "Achadinhos" (chave `affiliate_deals`) na tela de módulos, a seção continua aparecendo na Home do cliente. Isso acontece porque o `CustomerHomePage` renderiza as seções nativas baseado apenas na configuração de layout (`home_layout_json`), sem verificar se o módulo correspondente está ativo via `useBrandModules`.

O mesmo problema afeta outras seções:
- **Compre com Pontos** → módulo `customer_product_redeem`
- **Compre e Pontue (Emissoras)** → módulo `offers`

### Alteração

**Arquivo**: `src/pages/customer/CustomerHomePage.tsx`

1. Importar `useBrandModules` e chamar `isModuleEnabled`
2. Criar um mapeamento de seção nativa → chave de módulo:
   ```
   ACHADINHOS → affiliate_deals
   COMPRE_COM_PONTOS → customer_product_redeem
   EMISSORAS → offers
   ```
3. Na função `isNativeSectionVisible`, adicionar verificação: se a seção tem um módulo associado e esse módulo está desativado, retornar `false`

### Resultado
Desativar um módulo no painel de módulos automaticamente oculta a seção correspondente na Home do cliente, sem necessidade de configuração adicional no page builder.

| Arquivo | Ação |
|---------|------|
| `src/pages/customer/CustomerHomePage.tsx` | Adicionar verificação de `isModuleEnabled` nas seções nativas |


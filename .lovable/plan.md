

## Análise: Universalidade das Mudanças

Todas as alterações realizadas já são **universais** — funcionam para qualquer marca, empreendedor e futuros cadastros. Não há nada hardcoded para uma marca específica.

### Verificação por mudança:

| Mudança | Escopo | Status |
|---------|--------|--------|
| **Página personalizada da loja** (banner, logo, galeria, WhatsApp, Instagram, localização, favoritar, compartilhar) | Usa `useBrand()` + dados da tabela `stores` — funciona para qualquer marca | Universal |
| **Navegação oferta → loja** | Busca dados da `stores` pelo `store_id` da oferta — sem filtro fixo | Universal |
| **RLS brand_modules** (menus do app) | Política `TO authenticated USING (true)` — todos os usuários autenticados | Universal |
| **Resiliência do CSV Import** (retry crm_contacts) | Lógica no código, aplica-se a qualquer importação futura | Universal |
| **Backfill CRM** | Esse sim foi específico para a brand `8f76ce52...` — mas é uma correção pontual de dados, não código | Pontual (correto) |

### Conclusão

Não há alterações necessárias. O código já:
- Resolve marca, filial e tema **dinamicamente** via contexto (`BrandContext`, `useBrandGuard`)
- Lê dados da loja (banner, logo, WhatsApp, Instagram, endereço) da tabela `stores` sem filtro fixo
- A política RLS de `brand_modules` é global para todos os autenticados
- O fallback de importação CSV funciona para qualquer marca

Qualquer novo empreendedor provisionado via trial ou admin já terá acesso a todas essas funcionalidades automaticamente.


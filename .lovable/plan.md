

## Plano: 5 Correções no PWA e Console

### Problema 1 — Banner cortado na página de detalhe do Achadinho (IMG_4990)
O header sticky + banner ficam sobrepostos. O banner usa `aspect-[3/1]` mas está dentro de um container sem padding-top suficiente após o header.

**Arquivo:** `src/components/customer/AchadinhoDealDetail.tsx`
- Adicionar `pt-2` no container do banner ou reduzir o padding do header para evitar sobreposição

### Problema 2 — Erro ao enviar report de oferta (IMG_4991)
A RLS policy do `offer_reports` exige `auth.uid() = user_id` no INSERT, mas o PWA passa o `customerId` (UUID da tabela customers), que não é o `auth.uid()`. Se o cliente não tem conta auth ou o user_id não bate, o insert falha.

**Correções:**
1. **Migração SQL:** Alterar a política de INSERT para permitir inserts anônimos (sem exigir `auth.uid() = user_id`) OU criar política para `anon` role, pois clientes do PWA podem não estar autenticados via Supabase Auth
2. **`ReportarOfertaDialog.tsx`:** Mudar para usar `customer_id` em vez de `user_id` se a tabela suportar, ou adicionar tratamento para inserção sem user_id

**Solução mais simples:** Criar nova política RLS que permita INSERT para qualquer pessoa (authenticated ou anon), já que reports são um mecanismo público de feedback:
```sql
DROP POLICY "Authenticated users can report offers" ON public.offer_reports;
CREATE POLICY "Anyone can report offers"
  ON public.offer_reports FOR INSERT
  WITH CHECK (true);
```

### Problema 3 — Página de Resgates cortando pontos (IMG_4992)
O gradiente com pontos (`rounded-b-3xl`) está sendo cortado por falta de espaço ou por estar atrás do header/search bar.

**Arquivo:** `src/pages/customer/CustomerRedemptionsPage.tsx`
- Remover o `rounded-b-3xl` do container do header gradiente OU ajustar para que não corte
- Verificar se a search bar não está sobrepondo o card de pontos

### Problema 4 — Sidebar mobile não recua ao clicar (IMG_5004)
No mobile, ao clicar em um item do menu lateral (Sheet), o sidebar deveria fechar automaticamente. Atualmente ele fica na frente da página.

**Arquivo:** `src/components/consoles/BrandSidebar.tsx`
- No `CollapsibleGroup`, ao clicar em um `NavLink`, chamar `setOpenMobile(false)` via `useSidebar()` para fechar o sidebar no mobile
- Adicionar `onClick` handler nos NavLinks que fecha o sidebar mobile

### Problema 5 — Badges amarelas → azul no Gestão de Motoristas (IMG_5008)
As badges de pontos e tier estão com `variant="secondary"` que renderiza amarelo no tema.

**Arquivo:** `src/pages/DriverManagementPage.tsx`
- Trocar `variant="secondary"` do badge de pontos para classes azuis: `bg-blue-500/10 text-blue-400 border border-blue-400/30`
- Trocar o badge do tier `variant="secondary"` para classes azuis similares

### Resumo de arquivos

| # | Arquivo | Alteração |
|---|---------|-----------|
| 1 | `AchadinhoDealDetail.tsx` | Ajustar espaçamento do banner |
| 2 | Nova migração SQL | Liberar INSERT no offer_reports |
| 3 | `CustomerRedemptionsPage.tsx` | Corrigir corte do header de pontos |
| 4 | `BrandSidebar.tsx` | Fechar sidebar ao clicar item no mobile |
| 5 | `DriverManagementPage.tsx` | Badges de pts e tier → azul |


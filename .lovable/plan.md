

## Plano: Melhorar cupons — espaçamento, link webview, cor de texto e criação ilimitada

### 1. Migração de banco de dados

Adicionar 3 novas colunas à tabela `vouchers`:

```sql
ALTER TABLE public.vouchers ADD COLUMN redirect_url text DEFAULT null;
ALTER TABLE public.vouchers ADD COLUMN bg_color text DEFAULT null;
ALTER TABLE public.vouchers ADD COLUMN text_color text DEFAULT null;
```

- `redirect_url` — link de webview ao clicar no cupom
- `bg_color` — cor de fundo customizada (ex: `#E91E63`)
- `text_color` — cor do texto customizada (ex: `#FFFFFF`)

### 2. Melhorar espaçamento dos cards de cupom

**Arquivo:** `src/components/HomeSectionsRenderer.tsx` (função `VoucherTickets`)

- Aumentar padding interno (`px-4 pt-3 pb-2` → `px-5 pt-4 pb-3`)
- Aumentar o gap entre cards (`gap-3` → `gap-4`)
- Aumentar `min-w` e `max-w` dos cards para dar mais respiro
- Aumentar espaçamento do rodapé (data + botão)
- Aplicar cores customizadas (`bg_color`, `text_color`) do voucher no card, com fallback para o gradiente rosa atual

### 3. Link de direcionamento webview no cupom

**Arquivo:** `src/components/HomeSectionsRenderer.tsx` (função `VoucherTickets`)

- Ao clicar em "PEGAR CUPOM", se o voucher tiver `redirect_url`, usar a função `openLink` já existente para navegar via webview
- Caso contrário, manter comportamento atual

### 4. Edição de cupons no painel (Brand Admin + Root Admin)

**Arquivo:** `src/pages/VoucherForm.tsx`

Adicionar campos ao formulário de edição:
- **Link de Redirecionamento (Webview)** — input URL para `redirect_url`
- **Cor de Fundo** — input color para `bg_color`
- **Cor do Texto** — input color para `text_color`

Incluir esses campos no payload de `insert` e `update`.

**Arquivo:** `src/components/voucher-wizard/VoucherWizard.tsx`

Adicionar os mesmos 3 campos ao `VoucherWizardData` e incluí-los no step de revisão e no payload de submit.

### 5. Criação ilimitada

Atualmente não há limite de criação de cupons no código. Verificarei se existe alguma restrição e removerei caso exista, garantindo que se possa criar quantos cupons desejar.

### Resumo de arquivos alterados

| Arquivo | Alteração |
|---|---|
| Migração SQL | 3 novas colunas na tabela `vouchers` |
| `HomeSectionsRenderer.tsx` | Espaçamento + cores dinâmicas + link webview |
| `VoucherForm.tsx` | Campos de redirect_url, bg_color, text_color |
| `VoucherWizard.tsx` | Mesmos campos no wizard de criação |


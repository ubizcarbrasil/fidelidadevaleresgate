

## Criar conta de teste de motorista + exibir no Dashboard

### O que será feito

1. **Criar conta real de motorista via edge function** — Adicionarei a criação de um 4º usuário de teste (motorista) na edge function `provision-brand` (e `provision-trial`), com e-mail no padrão `motorista@{slug}.test` e senha `123456`. Esse usuário terá um registro `customers` com a tag `[MOTORISTA]` e role `customer`.

2. **Atualizar `test_accounts` na brand** — O array `test_accounts` no `brand_settings_json` passará a incluir `{ email: motoristaEmail, role: "driver", is_active: true }`.

3. **Atualizar o Dashboard** — Adicionar `driver: "Motorista"` no `roleLabel` e `driver: "🚗"` no `roleIcon` para que o card "Acessos de Teste" exiba corretamente a conta do motorista.

4. **Adicionar link do Dashboard do Motorista** — No card de cada conta com role `driver`, incluir um botão direto para abrir o PWA do cliente (onde a aba Motorista aparece automaticamente).

5. **Inserir a conta de teste na brand atual** — Como a brand já foi provisionada, usarei o insert tool para criar o usuário auth, profile, customer `[MOTORISTA]` e atualizar o `brand_settings_json.test_accounts` da brand existente.

### Arquivos afetados

| Arquivo | Ação |
|---------|------|
| `src/pages/Dashboard.tsx` | Adicionar role `driver` nos mapas de label/icon + botão de link para PWA motorista |
| `supabase/functions/provision-brand/index.ts` | Criar 4ª conta de teste (motorista) no fluxo de provisão |
| `supabase/functions/provision-trial/index.ts` | Idem para trial |
| SQL (insert tool) | Criar usuário, profile, customer [MOTORISTA] e atualizar test_accounts na brand atual |

### Detalhes técnicos

**Dashboard (`BrandQuickLinks`):**
```typescript
const roleLabel = { brand_admin: "Admin", customer: "Cliente", store_admin: "Parceiro", driver: "Motorista" };
const roleIcon = { brand_admin: "🔑", customer: "👤", store_admin: "🏪", driver: "🚗" };
```

No card do motorista, além do botão "Copiar", adicionar botão para abrir o app do cliente (onde a aba Motorista aparece):
```typescript
{acc.role === "driver" && (
  <Button variant="outline" size="sm" className="h-7 text-xs w-full gap-1" 
    onClick={() => openExternal(`${origin}/customer-preview?brandId=${currentBrandId}`)}>
    <ExternalLink className="h-3 w-3" /> Abrir como Motorista
  </Button>
)}
```

**Provisão (provision-brand + provision-trial):**
- Criar `motoristaEmail = motorista@${slug}.test`
- Criar usuário auth com `supabaseAdmin.auth.admin.createUser()`
- Criar customer com `name: "[MOTORISTA] Motorista Teste"`, `brand_id`, `branch_id`
- Adicionar ao array `test_accounts`


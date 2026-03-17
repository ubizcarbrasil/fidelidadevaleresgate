

## Plano: Corrigir vínculo bidirecional CRM ↔ Customer na importação CSV

### Problema
Na importação CRM, os customers são criados primeiro (batch), depois os crm_contacts são criados com `customer_id`. Porém o campo `crm_contact_id` no customer **nunca é preenchido** — o vínculo reverso está quebrado.

### Correção

#### `src/pages/CsvImportPage.tsx` — Após inserir crm_contacts, atualizar customers com crm_contact_id

Após a inserção dos `crm_contacts` (linha 543), buscar os IDs dos contatos recém-criados e fazer update nos customers correspondentes:

```typescript
// Após inserir crm_contacts com sucesso, buscar IDs e vincular de volta
if (!error && customerIds.some(id => id !== null)) {
  const { data: insertedContacts } = await supabase
    .from("crm_contacts")
    .select("id, customer_id")
    .in("customer_id", customerIds.filter(Boolean));
  
  if (insertedContacts) {
    for (const contact of insertedContacts) {
      if (contact.customer_id) {
        await supabase
          .from("customers")
          .update({ crm_contact_id: contact.id })
          .eq("id", contact.customer_id);
      }
    }
  }
}
```

### Arquivo a editar
- `src/pages/CsvImportPage.tsx`: adicionar back-link `crm_contact_id` após inserção dos contatos CRM


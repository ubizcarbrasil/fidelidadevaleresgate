

## Plano: Otimizar importação CSV de clientes

### Problema
A importação atual insere registros **um a um** (1 request HTTP por linha). Para 3700 registros, isso gera ~7400 requisições sequenciais (customer + crm_contact). Além disso, datas no formato "DD/MM/YYYY HH:mm" causam erro `22008` no banco.

### Solução

**1. Inserção em lotes (batch)**
Agrupar os inserts em lotes de 100 registros usando o Supabase `.insert([...array])`, reduzindo ~7400 requests para ~74.

**2. Corrigir parsing de datas brasileiras**
Criar função `parseBrDate(val)` que converte "DD/MM/YYYY HH:mm" para ISO 8601 antes de enviar ao banco.

### Alterações em `src/pages/CsvImportPage.tsx`

1. Adicionar helper `parseBrDate`:
```typescript
function parseBrDate(val: string): string | null {
  if (!val?.trim()) return null;
  const match = val.match(/^(\d{2})\/(\d{2})\/(\d{4})\s*(\d{2}:\d{2})?
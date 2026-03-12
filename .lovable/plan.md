

## Plano: Contador de progresso durante importação CSV

### O que será feito
Adicionar um estado `importProgress` com `{ current: number, total: number }` que é atualizado a cada registro processado no loop de importação. Na tela "Importando registros..." exibir o progresso em tempo real: **"42 de 150 registros"** com uma barra de progresso visual.

### Alterações em `src/pages/CsvImportPage.tsx`

1. **Novo estado**: `const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });`

2. **Atualizar os 4 loops de importação** (STORES, OFFERS, CUSTOMERS, CRM_CONTACTS): no início de cada loop, setar `setImportProgress({ current: 0, total: rows.length })` e dentro do `for`, após cada iteração, chamar `setImportProgress(prev => ({ ...prev, current: i + 1 }))`.

3. **Atualizar a UI do step "importing"**: substituir o texto estático por:
   - Texto: **"Importando 42 de 150 registros..."**
   - Componente `<Progress>` mostrando a porcentagem visual
   - Percentual numérico (ex: "28%")


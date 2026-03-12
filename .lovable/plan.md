

## Plano: Adicionar rótulos padrão faltantes no hook useMenuLabels

### Problema
As chaves `sidebar.partner_landing`, `sidebar.welcome_tour`, `sidebar.profile_links` e `sidebar.categorias_achadinhos` não existem no dicionário `DEFAULT_LABELS` em `useMenuLabels.ts`. Quando não há override no banco, o sistema exibe a chave técnica bruta.

### Solução
Adicionar essas 4 entradas ao objeto `DEFAULT_LABELS.admin` em `src/hooks/useMenuLabels.ts`:

```typescript
"sidebar.partner_landing": "LP de Parceiros",
"sidebar.welcome_tour": "Tour de Boas-Vindas",
"sidebar.profile_links": "Links do Perfil",
"sidebar.categorias_achadinhos": "Categorias Achadinhos",
```

Isso garante que todos os itens do sidebar exibam nomes amigáveis por padrão, sem depender de registros no banco. Funciona automaticamente para todas as marcas.

### Arquivo alterado
- `src/hooks/useMenuLabels.ts` — 4 linhas adicionadas ao `DEFAULT_LABELS.admin`


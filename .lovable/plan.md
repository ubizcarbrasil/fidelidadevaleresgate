

## Forçar rebuild para limpar cache

### Problema
A tela branca é causada por erros de build que referenciam código antigo (`categories`). O arquivo `DriverMarketplace.tsx` já contém o código correto (usa `viableCategories`), mas o build está usando uma versão em cache.

### Solução
Fazer uma edição mínima (adicionar um comentário) no arquivo para forçar o sistema de build a recompilar o arquivo do zero.

### Arquivo
`src/components/driver/DriverMarketplace.tsx` — adicionar comentário na linha 183:
```typescript
// Smart exposure rules: MIN_DEALS to show category, MIN_PER_ROW for row density
const MIN_DEALS = 3;
```

Nenhuma mudança de lógica — apenas forçar o rebuild.


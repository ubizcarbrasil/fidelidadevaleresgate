

## Diagnóstico

As três funcionalidades **já estão implementadas no código**:

1. **BrandSettingsPage** (linhas 89-97): Logo da marca usando `PlatformLogo` + `useBrandInfo`
2. **StoreOwnerPanel → StoreOwnerDashboard** (linhas 522-534): Logo da loja com fallback para ícone `Store`
3. **CsvImportPage** (linhas 106-113, 521+): Tipo `EARNING_EVENTS` com todos os 6 campos e lógica completa

### Possível causa

Você está na rota `/index` (landing page) — **não** no painel do empreendedor nem no painel do lojista. Para ver as mudanças:

- **Logo do empreendedor**: Faça login como `brand_admin` e acesse a página de Configurações/Métricas (BrandSettingsPage)
- **Logo da loja**: Faça login como `store_admin` e acesse o Painel do Parceiro (StoreOwnerPanel) → aba "Início"
- **Importação CSV**: Faça login como `brand_admin` e acesse a página de Importação CSV → selecione "Pontuação Manual" no dropdown

### Plano

Não há alterações de código necessárias — as funcionalidades já estão no código. O que posso fazer:

1. **Verificar se o preview carregou a versão mais recente** — recarregar o preview
2. **Testar via browser** navegando até as rotas corretas após login

Se você confirmar que está logado e nas telas certas e ainda assim não vê as mudanças, posso investigar mais a fundo com as ferramentas de debug.


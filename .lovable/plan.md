

# Adicionar campo de URL de eventos no formulário de Nova Cidade

## Problema
O formulário de criação de cidade (`/brand-branches/new`) não exibe a URL do webhook para receber eventos de corridas. Hoje, essa URL só aparece na tela de Integração Mobilidade (`/machine-integration`) após ativar a cidade. O empreendedor precisa navegar para outra tela para obter a URL.

## Solução
Adicionar ao formulário de criação/edição de cidade uma seção que exibe a URL do webhook **após salvar** (quando o `branchId` já existe). Para cidades novas, mostrar um aviso de que a URL será gerada após salvar. Para cidades existentes (edição), mostrar a URL pronta para copiar.

## Alterações

### `src/pages/BrandBranchForm.tsx`
1. Adicionar um bloco visual abaixo das credenciais que exibe a URL do webhook da cidade
2. A URL segue o padrão: `https://{SUPABASE_PROJECT_ID}.supabase.co/functions/v1/machine-webhook?brand_id={brandId}&branch_id={branchId}`
3. No modo **edição** (`isEdit = true`): exibir a URL completa com botão de copiar
4. No modo **criação** (`isEdit = false`): exibir mensagem informando que a URL será gerada após salvar a cidade
5. Após salvar uma cidade nova com sucesso, redirecionar para a edição onde a URL já estará visível (ou mostrar a URL no toast de sucesso)

## Detalhes Tecnico
- A URL é deterministica (não precisa de consulta ao banco): basta montar com `VITE_SUPABASE_PROJECT_ID`, `currentBrandId` e `branchId`
- Adicionar estado `copiedUrl` e botão com ícone `Copy`/`Check` para feedback visual
- Manter consistencia com o padrão visual já usado em `MachineIntegrationPage`


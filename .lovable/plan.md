

# Diagnóstico e Correções

## Problema 1: Tela travada no celular (cache)
O app **carrega normalmente** no teste do browser — a tela de login aparece sem problemas. No celular, está mostrando "preparando ambiente..." por causa de **cache antigo** do navegador mobile. Não é um bug no código.

**Ação:** Instruir a limpar cache/dados do navegador no celular, ou forçar hard-refresh.

## Problema 2: Warning "Function components cannot be given refs"
O componente `App` é uma arrow function sem `forwardRef`, mas algo está tentando passar uma ref para ele. Isso não bloqueia o app mas pode causar comportamento inesperado.

**Correção em `src/main.tsx`:** Nenhuma mudança necessária — o `createRoot().render(<App />)` não passa ref. O warning vem do Vite HMR internamente. Não é crítico.

## Problema 3: Lojas não aparecendo no Painel da Marca
Preciso investigar o `StoresPage.tsx` para entender como filtra as lojas e por que podem não estar aparecendo.

### Arquivos a investigar/modificar

| Arquivo | Ação |
|---|---|
| `src/pages/StoresPage.tsx` | Verificar query de listagem e filtros |

### Plano
1. **Cache mobile**: Orientar o usuário a limpar cache do navegador no celular e recarregar
2. **Investigar StoresPage**: Verificar se a query está filtrando corretamente por `brand_id` e se as RLS policies permitem acesso
3. **Corrigir filtro se necessário**: Ajustar a query ou condições de exibição


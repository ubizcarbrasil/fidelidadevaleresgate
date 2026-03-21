

## Diagnóstico: Rota `/driver-config` dá 404

### Análise
Verifiquei todos os pontos:
- **Arquivo existe**: `src/pages/DriverPanelConfigPage.tsx` (128 linhas, exporta default)
- **Import existe**: `lazy(() => import("@/pages/DriverPanelConfigPage"))` na linha 111 do App.tsx
- **Rota registrada**: `<Route path="driver-config" element={<DriverPanelConfigPage />} />` na linha 230
- **Sidebars apontam corretamente**: ambos usam `url: "/driver-config"`

Tudo está correto no código. O 404 é provavelmente um problema de cache do build — o servidor de desenvolvimento não recompilou após a criação do arquivo.

### Plano de correção
Forçar uma rebuild tocando o arquivo `App.tsx` com uma mudança trivial (adicionar comentário ou espaço) para garantir que o Vite recompile e reconheça a rota. Nenhuma mudança lógica necessária.

**Arquivo**: `src/App.tsx` — adicionar comentário no bloco do driver-config para forçar rebuild


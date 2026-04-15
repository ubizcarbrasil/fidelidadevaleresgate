

## Problema: Sem acesso ao painel do motorista no menu lateral

### Diagnóstico

A marca "Ubiz Resgata" tem `scoring_model = DRIVER_ONLY` e `machine_integration = false`. Isso causa:

1. No grupo **"Gestão Comercial"** do sidebar, todos os itens principais (Operador PDV, Ofertas, Resgates, Cupons, Parceiros, Clientes) têm `scoringFilter: "PASSENGER"` → ficam ocultos para DRIVER_ONLY
2. O item **"Motoristas"** exige `moduleKey: "machine_integration"` → oculto porque esse módulo está desativado
3. O item **"Patrocinados"** exige `moduleKey: "sponsored"` → também desativado
4. **Resultado**: o grupo "Gestão Comercial" fica completamente vazio e não renderiza
5. Não existe nenhum outro item no sidebar que leve ao painel do motorista (`/driver`)

### Correção

Duas mudanças no `src/components/consoles/BrandSidebar.tsx`:

1. **Adicionar um item "Painel do Motorista"** no grupo "Gestão Comercial" com `scoringFilter: "DRIVER"` que aponta para `/driver` (com `?brandId=` injetado dinamicamente). Isso garante que marcas com modelo DRIVER_ONLY tenham acesso direto ao painel.

2. **Registrar o novo item** no `MENU_REGISTRY` em `src/compartilhados/constants/constantes_menu_sidebar.ts` com key `sidebar.painel_motorista_view`, defaultTitle "Painel do Motorista", url `/driver`, icon `Car`, e `scoringFilter: "DRIVER"`.

### Arquivos afetados

- `src/compartilhados/constants/constantes_menu_sidebar.ts` — novo registro no MENU_REGISTRY
- `src/components/consoles/BrandSidebar.tsx` — adicionar item no grupo "Gestão Comercial" e ajustar a URL dinamicamente com `brandId`

### Resultado esperado

```text
scoring_model = DRIVER_ONLY
→ grupo "Gestão Comercial" mostra "Painel do Motorista" (link para /driver?brandId=xxx)
→ empreendedor consegue acessar o app do motorista pelo menu lateral
```


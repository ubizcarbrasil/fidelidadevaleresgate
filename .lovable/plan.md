

## Integrar CRM do Lince via iframe

### O que será feito

Substituir todo o conteúdo das rotas `/crm/*` por uma única página que carrega o CRM externo (`https://valeresgatacrm.lovable.app/`) dentro de um iframe fullscreen. O sidebar do CRM Estratégico será simplificado para um único item que abre essa página.

### Detalhes técnicos

#### 1. Criar página `CrmEmbedPage.tsx`
- Nova página em `src/pages/CrmEmbedPage.tsx`
- Contém um `<iframe>` apontando para `https://valeresgatacrm.lovable.app/` com `width: 100%`, `height: 100%` (ocupando toda a área de conteúdo)
- Sem borda, sem scroll duplo (`overflow: hidden` no container, `allow` adequados no iframe)

#### 2. Atualizar rotas em `src/App.tsx`
- Remover todas as 12 rotas individuais de `/crm/*` (linhas 224-235)
- Substituir por uma única rota: `<Route path="crm/*" element={<CrmEmbedPage />} />`

#### 3. Simplificar sidebar
- **BrandSidebar.tsx**: Reduzir o grupo "CRM Estratégico" para um único item "CRM Estratégico" apontando para `/crm`
- **RootSidebar.tsx**: Mesmo tratamento -- um único item "CRM Estratégico" apontando para `/crm`

#### 4. Limpeza
- Os imports lazy das 12 páginas CRM removidas serão eliminados do `App.tsx`
- Os arquivos de página CRM antigos (`CrmDashboardPage`, `CrmCustomersPage`, etc.) continuam existindo mas não serão mais referenciados pelas rotas

### Observação importante
O iframe pode ser bloqueado pelo CRM externo se ele tiver header `X-Frame-Options: DENY` ou `Content-Security-Policy: frame-ancestors 'none'`. Se isso acontecer, será necessário ajustar as configurações do projeto externo para permitir embedding.


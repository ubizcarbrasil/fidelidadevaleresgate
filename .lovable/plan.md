

## Diagnóstico

O problema está no componente `Tabs` usando `defaultValue="list"` (não controlado). Quando o `ImageCropDialog` abre/fecha (ao fazer upload de imagem), ou quando ocorre qualquer re-render significativo do componente, o estado da aba reseta para "list", desmontando a aba "manual" e **perdendo todos os drafts preenchidos**.

Além disso, o `ImageCropDialog` abre um `Dialog` modal que pode causar eventos de foco que interferem com o `Tabs`.

## Correção

**Arquivo: `src/pages/AffiliateDealsPage.tsx`**

1. **Tornar o Tabs controlado** — trocar `defaultValue="list"` por estado controlado com `useState`:
   ```tsx
   const [activeTab, setActiveTab] = useState("list");
   // ...
   <Tabs value={activeTab} onValueChange={setActiveTab}>
   ```

2. **Não resetar drafts imediatamente no onSuccess** — após salvar em massa, manter na aba "manual" e só limpar os drafts salvos com sucesso, mostrando feedback antes de limpar.

Isso resolve o problema de perda de dados e fechamento inesperado da aba.

## Arquivos afetados
- `src/pages/AffiliateDealsPage.tsx` — única mudança: Tabs controlado + preservação de estado


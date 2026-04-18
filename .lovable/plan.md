
## Ghost commit + rebuild para invalidar cache do preview

### Ação única
Adicionar 1 linha de comentário no topo de `src/features/central_modulos/pagina_central_modulos.tsx` para forçar novo hash de chunk no build do Vite.

```tsx
// Fase 4.1b - rebuild forçado em 2026-04-18 (invalidar cache de bundle do preview)
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
...resto do arquivo intacto...
```

Sem mudança lógica. Sem mudança de UI. Sem mudança em mais nenhum arquivo.

### Verificação após salvar (em modo de execução)
1. `npm run build` no sandbox.
2. `ls dist/assets/pagina_central_modulos-*.js` → capturar **novo hash**.
3. Comparar com hash anterior (`DpmMw-KM`).
4. `grep -l "AbaEmpreendedores"` e `grep -l "AbaCidades"` no novo chunk.
5. Confirmar build limpo (0 erros TS).

### Entrega ao usuário
- Hash antigo: `pagina_central_modulos-DpmMw-KM.js`
- Hash novo: `pagina_central_modulos-XXXXXX.js`
- Status do build (tempo + 0 erros)
- Confirmação dos 4 componentes presentes no novo chunk
- Instrução para testar: abrir preview em **Safari aba privada** colando a URL `https://id-preview--3ff47979-b8b4-4666-bfef-7987c2d119c3.lovable.app/admin/central-modulos` diretamente na barra (não clicar em link salvo, para evitar redirect para `app.valeresgate.com.br`)

### O que NÃO vou fazer
- Não publicar para produção.
- Não tocar Service Worker / `vite.config.ts`.
- Não alterar lógica das abas.
- Não republicar o domínio custom.

### Limitação honesta
Não tenho API/comando para forçar invalidação do CDN do preview do Lovable. Confio no fluxo padrão: novo commit → Vite gera chunk com novo hash → `index.html` aponta para o novo hash → preview serve o novo bundle. Se mesmo assim o preview ainda mostrar 2 abas após hard reload em aba privada, paramos e escalamos para o suporte do Lovable conforme combinado.

### Risco
Mínimo. 1 linha de comentário. Rollback trivial.

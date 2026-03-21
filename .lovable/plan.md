

## Plano: Corrigir link público e lentidão no compartilhamento

### Problema

A imagem mostra o Safari tentando abrir `123456.valeresgate.com` — esse domínio está cadastrado em `brand_domains` mas **não existe no DNS** (não aponta para nenhum servidor). O `getPublicOrigin` busca esse domínio e gera links quebrados.

Além disso, a consulta assíncrona ao banco a cada clique de compartilhar causa lentidão perceptível.

### Correção

**`src/lib/publicShareUrl.ts`** — simplificar `getPublicOrigin`

Remover a consulta a `brand_domains` e usar `window.location.origin` diretamente. Quando o app estiver no domínio publicado (`fidelidadevaleresgate.lovable.app`), os links apontarão para lá — que funciona. Quando estiver no preview, apontará para o preview — que também funciona (o bypass `/driver` está ativo).

Isso resolve os dois problemas:
1. Links param de apontar para domínios inexistentes
2. Compartilhamento fica instantâneo (sem query ao banco)

Quando os domínios customizados estiverem de fato configurados no DNS, a lógica de lookup pode ser reativada.

### Arquivo
- `src/lib/publicShareUrl.ts`


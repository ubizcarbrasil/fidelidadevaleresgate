

## Plano: Corrigir URL de compartilhamento para usar domínio publicado

### Problema

Quando o admin compartilha o link do Achadinhos a partir do preview do Lovable, `window.location.origin` retorna `https://id-preview--3ff47979-b8b4-4666-bfef-7987c2d119c3.lovable.app` — uma URL de preview que não é acessível publicamente. O link correto deveria usar `https://fidelidadevaleresgate.lovable.app`.

Como o campo `driver_public_base_url` provavelmente não está preenchido, o fallback cai em `window.location.origin`, que no preview é a URL errada.

### Correção

**`src/lib/publicShareUrl.ts`** — melhorar o fallback

Adicionar detecção automática de ambiente preview do Lovable. Se o origin contém `id-preview--` (padrão de preview URLs), substituir automaticamente pela URL publicada equivalente (`{slug}.lovable.app`).

Ordem de prioridade:
1. `driver_public_base_url` configurado manualmente (já existe)
2. Se estiver em preview Lovable, converter para URL publicada
3. `window.location.origin` como último fallback

```typescript
export async function getPublicOrigin(brandId: string): Promise<string> {
  if (cachedBaseUrls[brandId]) return cachedBaseUrls[brandId];

  // 1. Check configured URL
  try {
    const { data } = await supabase
      .from("brands")
      .select("brand_settings_json")
      .eq("id", brandId)
      .maybeSingle();
    const settings = data?.brand_settings_json as Record<string, unknown> | null;
    const configuredUrl = (settings?.driver_public_base_url as string)?.trim().replace(/\/+$/, "");
    if (configuredUrl) {
      cachedBaseUrls[brandId] = configuredUrl;
      return configuredUrl;
    }
  } catch { /* fall through */ }

  // 2. Detect Lovable preview and use published URL instead
  let fallback = window.location.origin;
  const previewMatch = fallback.match(/^https:\/\/id-preview--[^.]+\.lovable\.app$/);
  if (previewMatch) {
    fallback = "https://fidelidadevaleresgate.lovable.app";
  }

  cachedBaseUrls[brandId] = fallback;
  return fallback;
}
```

Porém, hardcodar o domínio publicado não é ideal para múltiplas marcas. Uma abordagem melhor é buscar o published URL do projeto via variável de ambiente ou configuração existente.

**Abordagem recomendada**: Como o projeto tem `VITE_SUPABASE_URL` e `VITE_SUPABASE_PROJECT_ID` como env vars, mas não tem a published URL como env var, a solução mais robusta e imediata é:

- Detectar se estamos em preview (`id-preview--` no origin)
- Se sim, usar `https://fidelidadevaleresgate.lovable.app` como fallback fixo (este é o domínio publicado real do projeto)
- Alternativamente, o admin pode simplesmente preencher o campo "URL Pública Oficial" na configuração do motorista com `https://fidelidadevaleresgate.lovable.app`

A segunda opção é mais simples e já está implementada — basta configurar o campo. Mas vou implementar a detecção automática também para evitar esse problema recorrente.

### Arquivo
- `src/lib/publicShareUrl.ts`


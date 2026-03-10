

# Fix: Imagens faltando / quebradas no app do cliente

## Problema identificado

Nas screenshots, há dois problemas distintos:

1. **Imagens quebradas (ícone de "?" azul)**: Ofertas e lojas que possuem `image_url` ou `logo_url` no banco, mas a URL aponta para um arquivo inexistente ou inacessível no storage. O navegador tenta carregar e mostra o ícone de imagem quebrada.

2. **Imagens ausentes (placeholder rosa)**: Ofertas/lojas sem `image_url` ou `logo_url` cadastrados. Isso exibe o fallback correto (ícone genérico), mas visualmente não é ideal.

O problema principal de **código** é o item 1: quando a URL existe mas falha, não há `onError` handler para exibir o fallback graciosamente. Apenas o `ForYouSection` tem `onError`, mas ele só esconde a imagem sem mostrar o placeholder.

## Solução

Adicionar handlers `onError` em todos os locais que renderizam imagens de ofertas e lojas, fazendo fallback para o placeholder estilizado quando a imagem falha ao carregar. Isso resolve o ícone de "?" azul.

### Arquivos a modificar

1. **`src/pages/customer/CustomerOffersPage.tsx`**
   - Linha ~207: Adicionar `onError` na `<img>` de `offer.image_url` — ao falhar, tentar `offer.stores?.logo_url`; se também falhar, trocar para o placeholder `<ShoppingBag>`
   - Linha ~240: Adicionar `onError` na `<img>` do logo da loja inline

2. **`src/pages/customer/CustomerStoreDetailPage.tsx`**
   - Linha ~429: Adicionar `onError` na `<img>` de `offer.image_url`

3. **`src/components/customer/ForYouSection.tsx`**
   - Linha ~93: Melhorar o `onError` existente — em vez de só esconder, substituir por placeholder com `AppIcon`

4. **`src/components/customer/EmissorasSection.tsx`**
   - Linha ~127: Adicionar `onError` na `<img>` de `store.logo_url` para fallback ao ícone genérico

5. **`src/pages/customer/CustomerOfferDetailPage.tsx`**
   - Linhas ~347, ~470, ~498, ~650: Adicionar `onError` handlers nas imagens hero e similares

### Estratégia técnica

Usar `useState` local ou manipulação direta do DOM no `onError`:
```tsx
// Padrão: esconder img e mostrar sibling fallback
onError={(e) => {
  const el = e.currentTarget;
  el.style.display = "none";
  const fallback = el.nextElementSibling as HTMLElement;
  if (fallback) fallback.style.display = "flex";
}}
```

Ou mais simplesmente, usar um estado `imgError` por card para re-renderizar com o placeholder. Para listas, a abordagem DOM é mais performática.

Alternativa mais limpa: criar um componente reutilizável `<SafeImage>` que encapsula essa lógica de fallback.

### Componente auxiliar proposto

```tsx
// src/components/customer/SafeImage.tsx
function SafeImage({ src, fallbackSrc, alt, className, fallback }) {
  const [error, setError] = useState(false);
  const [fallbackError, setFallbackError] = useState(false);
  
  if (!src || (error && (!fallbackSrc || fallbackError))) return fallback;
  if (error && fallbackSrc) {
    return <img src={fallbackSrc} alt={alt} className={className} onError={() => setFallbackError(true)} />;
  }
  return <img src={src} alt={alt} className={className} onError={() => setError(true)} />;
}
```

Usar este componente em todos os 5 arquivos acima substitui a lógica ternária `image_url ? <img> : <placeholder>` por `<SafeImage src={image_url} fallbackSrc={logo_url} fallback={<PlaceholderDiv/>} />`.


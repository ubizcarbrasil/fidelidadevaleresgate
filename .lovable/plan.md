

## Plano: Trocar indicadores circulares por caracteres de ponto "•"

### Alterações

**Arquivo**: `src/components/HomeSectionsRenderer.tsx` (linhas 986-1001)
- Substituir os `<button>` com bolinhas CSS por caracteres de texto `•` (bullet)
- Dot ativo: cor primária, dot inativo: cinza com opacidade baixa
- Tamanho pequeno (`text-[8px]`), espaçamento mínimo (`gap-0.5`)
- Manter funcionalidade de clique para navegar

**Arquivo**: `src/components/driver/DriverBannerCarousel.tsx` (linhas ~71-82)
- Mesma alteração: trocar divs circulares por caracteres `•`

### Resultado
Indicadores viram pontinhos de texto discretos (como "• • • •") abaixo do banner.

| Arquivo | Ação |
|---------|------|
| `src/components/HomeSectionsRenderer.tsx` | Trocar dots CSS por caracteres "•" |
| `src/components/driver/DriverBannerCarousel.tsx` | Mesma troca |


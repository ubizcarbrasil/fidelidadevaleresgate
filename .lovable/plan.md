

## Plano: Ajustar indicadores do banner e trocar ícone de presente por moedas

### Alterações

**Arquivo**: `src/components/HomeSectionsRenderer.tsx` (linhas 986-1000)
- Reduzir os dots do banner de 6px para 4px de altura/largura
- Reduzir o gap entre dots de `gap-1.5` para `gap-1`
- Reduzir margem superior de `mt-2` para `mt-1.5`
- Resultado: indicadores mais discretos e sutis

**Arquivo**: `src/components/customer/CompreComPontosSection.tsx`
- Trocar o import `Gift` por `Coins` do lucide-react
- Substituir todas as ocorrências de `<Gift>` por `<Coins>` no header e na pill "Todos"
- Manter `<Gift>` apenas nos cards de deal (fallback de imagem e badge de pontos) ou trocar também se fizer sentido visual

### Resultado
- Dots do banner ficam menores e mais discretos
- Seção "Compre com Pontos" usa ícone de moedas (🪙) em vez de presente (🎁)

| Arquivo | Ação |
|---------|------|
| `src/components/HomeSectionsRenderer.tsx` | Reduzir tamanho dos dots do banner |
| `src/components/customer/CompreComPontosSection.tsx` | Trocar Gift por Coins |


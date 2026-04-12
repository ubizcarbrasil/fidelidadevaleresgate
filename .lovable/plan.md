

## Plano: Card de pontos com cor laranja fixa

### Alteração

**Arquivo**: `src/pages/customer/CustomerHomePage.tsx` (linhas 186-191)

Substituir o gradiente que usa `accent`/`primary` por um gradiente laranja fixo, semelhante ao visual original da imagem.

- Background: `linear-gradient(135deg, #f59e0b, #d97706)` (tons de laranja/âmbar)
- Texto: branco (`#fff`) para contraste
- Manter círculos decorativos, layout e funcionalidade intactos

### Resultado
O card de pontos volta a ter a cor laranja de destaque, independente do tema configurado.

| Arquivo | Ação |
|---------|------|
| `src/pages/customer/CustomerHomePage.tsx` | Trocar gradiente do card de pontos para laranja |


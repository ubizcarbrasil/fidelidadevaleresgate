

## Plano: Aumentar ícones de categorias

### Situação atual
No `SegmentNavSection.tsx`:
- Container de cada item: `width: 68px`
- Círculo do ícone: `h-11 w-11` (44px)
- Ícone interno: `h-5 w-5` (20px)
- Texto: `text-[9px]`

### Referência (screenshot)
Os cards de categoria têm ~100px de largura, ícones com ~28-32px dentro de círculos de ~64px, e texto ~11px.

### Alterações

**`src/components/customer/SegmentNavSection.tsx`**

| Propriedade | Atual | Novo |
|---|---|---|
| Container width | 68px | 88px |
| Círculo do ícone | h-11 w-11 (44px) | h-16 w-16 (64px) |
| Ícone (CategoryIcon) | h-5 w-5 (20px) | h-7 w-7 (28px) |
| Rounded do círculo | rounded-xl | rounded-2xl |
| Texto | text-[9px] | text-[11px] |
| Gap entre ícone e texto | gap-1 | gap-1.5 |


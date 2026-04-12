

## Plano: Criar seção independente "Compre com Pontos"

### Problema
A categoria "Resgatar com Pontos" está embutida dentro da seção Achadinhos como uma categoria virtual. O usuário quer que seja uma **seção separada** com o nome "COMPRE COM PONTOS", mantendo a mesma estética de categorias/carrosséis.

### Alterações

**Arquivo novo**: `src/components/customer/CompreComPontosSection.tsx`
- Seção independente que busca apenas deals com `is_redeemable = true` e `redeemable_by` compatível (customer/both)
- Header com título "Compre com Pontos" e subtítulo
- Categorias filtradas (pills horizontais) — mostra apenas categorias que possuem produtos resgatáveis
- Carrosséis horizontais por categoria (mesma estética do Achadinhos)
- Cards exibem preço em pontos (pts) em destaque
- Reutiliza o `DealCard` e `AchadinhoDealDetail` existentes
- Respeita configuração de linhas (`customer_redeem_rows`)

**Arquivo**: `src/components/customer/AchadinhoSection.tsx`
- Remover a categoria virtual "Resgatar com Pontos" (linhas 234-251)
- Remover o filtro `REDEEMABLE_ID` e referências a `isVirtualRedeemable`
- Deals resgatáveis não aparecem mais nos Achadinhos

**Arquivo**: `src/pages/customer/CustomerHomePage.tsx`
- Importar e renderizar `CompreComPontosSection` como seção separada (antes ou depois dos Achadinhos, conforme layout)
- Passar callbacks de navegação necessários

### Resultado
- Achadinhos mostra apenas ofertas de afiliados normais
- "Compre com Pontos" é uma seção própria, visualmente destacada, com categorias e carrosséis independentes

### Arquivos

| Arquivo | Ação |
|---------|------|
| `src/components/customer/CompreComPontosSection.tsx` | Novo — seção independente de resgate com pontos |
| `src/components/customer/AchadinhoSection.tsx` | Remover categoria virtual "Resgatar com Pontos" |
| `src/pages/customer/CustomerHomePage.tsx` | Adicionar nova seção ao layout da home |


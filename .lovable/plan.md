
Problema identificado: o banner do topo do motorista ainda está diferente do app do cliente porque o componente do motorista usa um carrossel próprio, com layout diferente do banner do passageiro.

O que está causando o erro:
- No cliente, o banner usa um container único com `relative rounded-2xl overflow-hidden h-40`
- A imagem ocupa `w-full h-full object-cover`
- Os indicadores ficam sobrepostos dentro do banner
- No motorista, o componente atual usa:
  - `flex overflow-x-auto`
  - cada slide com `min-w-full`
  - imagem com `h-40` direto no `<img>`
  - indicadores fora do banner
- Esse formato deixa o encaixe mais frágil e visualmente diferente, principalmente com imagens largas como a da sua captura

O que vou ajustar:
1. Trocar a implementação do `DriverBannerCarousel` para seguir o mesmo padrão visual do banner do cliente
2. Renderizar apenas o banner ativo por vez, dentro de um container fixo `h-40 rounded-2xl overflow-hidden`
3. Fazer a imagem ocupar o container inteiro com `w-full h-full object-cover`
4. Colocar os indicadores dentro do banner, na parte inferior, igual ao cliente
5. Manter autoplay e clique no link do banner

Arquivos envolvidos:
- `src/components/driver/DriverBannerCarousel.tsx`

Resultado esperado:
- o banner do topo vai ficar com o mesmo encaixe do app do cliente
- sem “quebra” lateral ou sensação de imagem mal cortada
- com altura, bordas e paginação visual iguais ao passageiro

Detalhe técnico:
Hoje o driver está usando um “scroll carousel”; o cliente usa um “single active slide”. Para ficar igual ao app do cliente, o correto é o driver adotar a mesma estrutura do segundo modelo, e não apenas trocar classes de altura.

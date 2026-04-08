
Objetivo: corrigir de forma definitiva a inconsistência em que um duelo “Agendado” aparece dentro da seção “Ao vivo na cidade”.

Diagnóstico
- Pelo código atual, o `DuelsHub.tsx` já separa corretamente:
  - `live` → “Ao vivo na cidade”
  - `accepted` → “Agendados na cidade”
- Como o print ainda mostra “Agendado” dentro de “Ao vivo”, a causa mais provável é uma destas:
  1. regra de status ainda espalhada em outros componentes do módulo, gerando comportamento inconsistente;
  2. preview/publicação com bundle antigo em algum fluxo.
- Eu encontrei outros componentes do mesmo módulo que ainda misturam `live` + `accepted` como “ativo/em andamento”, então a correção precisa ser centralizada, não só pontual.

Plano de implementação
1. Centralizar a classificação dos duelos da cidade
- Criar uma regra única no módulo de duelos para separar:
  - `aoVivo`: apenas `status === "live"`
  - `agendados`: apenas `status === "accepted"`
  - `demais`: restante
- Isso evita que cada componente decida sozinho o que é “ao vivo”.

2. Aplicar essa regra no hub principal
- Revisar `src/components/driver/duels/DuelsHub.tsx` para garantir que a seção “Ao vivo na cidade” nunca renderize item fora de `live`.
- Manter “Agendados na cidade” como seção separada.

3. Blindar o card público contra contexto errado
- Ajustar `src/components/driver/duels/CardDueloPublico.tsx` para receber contexto da seção ou uma proteção equivalente.
- Se o card estiver na seção “ao vivo”, ele não deve exibir badge “Agendado”.
- Isso cria uma segunda camada de segurança visual.

4. Corrigir componentes paralelos que ainda misturam estados
- Revisar componentes do mesmo módulo que hoje tratam `accepted` como se fosse “ao vivo”, especialmente:
  - `src/components/driver/duels/BannerDueloAoVivo.tsx`
  - `src/components/driver/duels/dashboard/CardDuelosAoVivo.tsx`
  - `src/components/driver/duels/SecaoDuelosCidade.tsx`
- Assim o comportamento fica consistente em todo o produto, não só nessa tela.

5. Validação final
- Conferir no preview e no publicado:
  - duelo `live` aparece só em “Ao vivo na cidade”
  - duelo `accepted` aparece só em “Agendados na cidade”
  - nenhum card mostra badge incompatível com o título da seção
- Também validar com refresh forçado para descartar cache.

Arquivos impactados
- `src/components/driver/duels/DuelsHub.tsx`
- `src/components/driver/duels/CardDueloPublico.tsx`
- `src/components/driver/duels/BannerDueloAoVivo.tsx`
- `src/components/driver/duels/dashboard/CardDuelosAoVivo.tsx`
- `src/components/driver/duels/SecaoDuelosCidade.tsx`

Detalhe técnico
- Hoje o problema não parece ser apenas de filtro local no hub; ele é de consistência de regra no módulo.
- A correção certa é transformar “o que é ao vivo” em uma única verdade compartilhada.

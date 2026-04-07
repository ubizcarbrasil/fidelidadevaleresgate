
Objetivo: fazer com que qualquer motorista veja claramente os duelos em andamento dentro do módulo de Duelos, não só na home do marketplace, e consiga abrir a Arena para assistir/palpitar.

Diagnóstico
- O backend já tem duelo ativo nessa cidade e a visualização pública está habilitada.
- O problema principal não parece ser dados, e sim onde a UI pública aparece.
- Hoje a visualização pública está em `DriverMarketplace` via `BannerDueloAoVivo` e `SecaoDuelosCidade`.
- Na tela `DuelsHub`, o conteúdo usa `useDriverDuels()`, que mostra só os duelos do próprio motorista. Se ele não participa de nenhum, cai no estado vazio “Nenhum duelo ainda”, mesmo existindo duelo rolando na cidade.
- Isso bate com seus prints: o motorista entra em “Duelos” e vê tela vazia, então parece que “não tem nada ao vivo”.

Plano de implementação

1. Colocar a seção pública dentro do `DuelsHub`
- Adicionar `useDuelosCidade()` no `DuelsHub`.
- Criar um bloco no topo da tela com algo como “Assistir duelos da cidade”.
- Mostrar os duelos `live` e `accepted` ali, para qualquer motorista.
- Cada card abre `ArenaAoVivo` direto.

2. Priorizar “ao vivo” antes dos duelos pessoais
- Dentro do `DuelsHub`, exibir primeiro:
  - “Ao vivo na cidade”
  - depois “Desafios recebidos”, “Contrapropostas”, “Meus duelos”, etc.
- Assim o motorista entende imediatamente onde assistir.

3. Corrigir o estado vazio do módulo
- O estado “Nenhum duelo ainda” só deve aparecer quando:
  - não houver duelo próprio
  - e também não houver duelo público na cidade
- Se existir duelo público, mostrar essa seção em vez da tela vazia.

4. Melhorar a sinalização para espectadores
- Deixar o card público mais explícito para quem só quer assistir:
  - CTA principal “Assistir ao vivo”
  - CTA secundário “Dar palpite”
- Ajustar o texto para “Duelos acontecendo agora na cidade” em vez de algo genérico.

5. Manter a home como ponto extra de entrada
- Preservar `BannerDueloAoVivo` e `SecaoDuelosCidade` na home.
- O ajuste principal será no `DuelsHub`, porque é onde o usuário naturalmente vai procurar os duelos.

Arquivos a ajustar
- `src/components/driver/duels/DuelsHub.tsx`
  - incluir a listagem pública da cidade
  - abrir `ArenaAoVivo` a partir dessa lista
  - corrigir lógica do estado vazio
- `src/components/driver/duels/CardDueloPublico.tsx`
  - reforçar CTA de assistir/palpitar
- Possivelmente `src/components/driver/duels/SecaoDuelosCidade.tsx`
  - reaproveitar layout/padrão visual dentro do hub, se fizer sentido

Detalhes técnicos
- Não precisa mudança de banco para isso.
- As tabelas de duelos e participantes já estão legíveis para consulta pública no app.
- A configuração da filial já permite visualização pública.
- O duelo público deve vir de `useDuelosCidade(branchId)`, não de `useDriverDuels()`.
- A abertura da transmissão/visualização será com `ArenaAoVivo`, reaproveitando o fluxo já existente.

Resultado esperado
- Mesmo sem participar, qualquer motorista entra em “Duelos” e vê quem está duelando naquele momento.
- Ele consegue tocar no card e assistir a disputa.
- A tela deixa de parecer vazia quando há duelo acontecendo na cidade.

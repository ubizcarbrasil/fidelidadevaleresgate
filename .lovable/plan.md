

## Sinalização de Duelos Ativos + Palpites para Todos os Motoristas

### Problema
1. O popup de desafio recebido já está implementado e integrado no `DriverMarketplace`, mas pode não estar disparando corretamente (depende do motorista ter participação ativa — `useDuelParticipation` retorna `participant` apenas se já fez opt-in).
2. Motoristas da cidade que **não participam** dos duelos não têm sinalização destacada de que há duelos ao vivo acontecendo, nem acesso fácil ao sistema de palpites.

### Solução

#### 1. Corrigir o popup para desafiados participantes
O hook `useEscutaDesafiosRecebidos` já depende de `participant?.id` do `useDuelParticipation`. Se o motorista tem participação ativa, o listener funciona. O problema pode ser que o `PopupDesafioRecebido` está sendo renderizado **dentro** do `showDuels` condicional ou atrás de algum overlay. Verificar e garantir que está no nível correto (já está no final do JSX — OK).

**Ação**: Nenhuma mudança necessária no popup existente — já está correto.

#### 2. Criar banner flutuante "Duelo Ao Vivo" na tela principal
Novo componente `BannerDueloAoVivo.tsx` que aparece na home do motorista quando há duelos `live` na cidade:

- Usa o hook `useDuelosCidade` já existente para detectar duelos ao vivo
- Exibe um banner fixo (sticky) no topo ou como floating bar com:
  - Ícone animado (⚔️ pulsando)
  - Nomes dos duelistas e placar resumido
  - Botão "Acompanhar" → abre `ArenaAoVivo` (que já tem palpites integrados)
  - Botão "Dar Palpite" → abre `ArenaAoVivo` direto na seção de palpites
- Visível para **todos** os motoristas da cidade, independente de terem opt-in nos duelos

#### 3. Integrar no `DriverMarketplace.tsx`
- Importar e renderizar `BannerDueloAoVivo` no topo da tela (após header, antes do conteúdo)
- Ao clicar, abre a `ArenaAoVivo` diretamente (sem precisar entrar no DuelsHub)

### Arquivos

- **Novo**: `src/components/driver/duels/BannerDueloAoVivo.tsx` — banner flutuante com placar + CTA
- **Editado**: `src/components/driver/DriverMarketplace.tsx` — integrar banner no layout principal
- **Editado**: `src/components/driver/duels/SecaoDuelosCidade.tsx` — adicionar botão "Dar Palpite" nos cards públicos ao vivo

### Detalhes técnicos

**BannerDueloAoVivo.tsx**:
```tsx
// Filtra duelos ao vivo do hook useDuelosCidade
// Exibe card compacto com nomes, placar e CTAs
// Usa AnimatePresence para entrada/saída suave
// Clique abre ArenaAoVivo (que já tem PalpitesDuelo integrado)
```

**CardDueloPublico.tsx** — adicionar botão "Dar Palpite 🎯" nos cards de duelos ao vivo para incentivar engajamento.


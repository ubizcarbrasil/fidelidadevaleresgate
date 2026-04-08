

## Atualizar AjudaDuelosSheet com a Jornada Completa dos Duelos

### Objetivo
Reescrever o conteúdo do `AjudaDuelosSheet.tsx` para cobrir **toda a jornada** do sistema de duelos — desde a criação do desafio até apostas paralelas, negociação de pontos, arena ao vivo, ranking, cinturão, conquistas, perfil competitivo e feed social.

### O que muda
Arquivo único: `src/components/driver/duels/AjudaDuelosSheet.tsx`

### Novas seções do accordion (substituindo as atuais)

1. **Como funciona o duelo?** — Competição entre motoristas da mesma cidade, corridas finalizadas no período
2. **Como desafiar alguém?** — Seleção de adversário(s), definição de período e aposta de pontos opcional
3. **Negociação de pontos** — Contraproposta de valor, aceite/recusa da contraproposta, escrow automático
4. **Aceitar ou recusar desafio** — Confirmação com aviso de risco, reserva imediata de pontos
5. **Contagem de corridas** — Apenas FINALIZED dentro do período, 100% automático
6. **Arena ao vivo** — Placar em tempo real, palpites da torcida, badges de liderança
7. **Apostas entre espectadores** — Sistema P2P: criar aposta, aceitar ou contrapropor valor, escrow, liquidação 90/10
8. **Bônus 10% para o vencedor** — Explicação do prêmio extra vindo das apostas de espectadores
9. **Ranking da cidade** — Classificação por corridas/pontos, atualização automática
10. **Cinturão da cidade** — Título máximo, troca de mãos, destaque especial
11. **Perfil competitivo** — Apelido público, avatar, conquistas, estatísticas
12. **Feed de atividade** — Timeline social: desafios, aceites, resultados, recusas
13. **Privacidade e anonimato** — Apelido público, sem dados de rota/valor
14. **Dúvidas frequentes** — FAQ atualizado incluindo apostas, empate, limites, pontos pendentes

### Detalhes técnicos
- Mesmo componente `Sheet` + `Accordion` existente
- Apenas atualização do array `secoes` com novos ícones (adicionar `Handshake`, `Wallet`, `Gift`, `Star` do lucide)
- Nenhuma mudança estrutural, apenas conteúdo expandido
- Textos em português brasileiro, linguagem acessível e direta


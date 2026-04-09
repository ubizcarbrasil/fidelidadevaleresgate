

# Notificação Fluorescente de Desafio Recebido

## Problema
O popup atual de desafio recebido é um Dialog discreto que pode passar despercebido. O motorista não sabe que tem um desafio se não abrir a seção de duelos.

## Solução
Transformar o popup em uma experiência visual impactante com:

1. **Overlay full-screen pulsante** — fundo escuro semi-transparente com borda neon verde fluorescente animada
2. **Animação de entrada** — o card entra com scale + fade, com glow neon pulsando ao redor
3. **Ícone grande animado** — espadas cruzadas com efeito de brilho/pulse
4. **Texto grande e chamativo** — "VOCÊ FOI DESAFIADO!" em fonte bold com cor neon
5. **Efeito de vibração** — chamada a `navigator.vibrate()` (quando suportado) para alertar fisicamente
6. **Badge persistente** — quando o motorista fecha o popup sem ver o desafio, mostrar um badge pulsante no botão de Duelos na home para lembrar que há desafio pendente

## Mudanças

### `src/components/driver/duels/PopupDesafioRecebido.tsx`
- Substituir o Dialog discreto por um overlay full-screen com z-50
- Adicionar animações CSS: glow neon pulsante (box-shadow verde fluorescente), scale-in do card, ícone com pulse
- Texto principal "VOCÊ FOI DESAFIADO!" grande e fluorescente
- Card central com borda neon animada (alternando intensidade)
- Botão "Ver Desafio" grande e brilhante, botão "Mais tarde" secundário
- Chamar `navigator.vibrate([200, 100, 200])` ao montar

### `src/components/driver/DriverMarketplace.tsx`
- Passar estado `desafioPendente` para o banner/botão de Duelos
- Quando houver desafio pendente (mesmo após fechar popup), mostrar um indicador pulsante vermelho/verde no card "Duelos entre Motoristas" na home

### CSS (inline via Tailwind + style)
- Keyframes para glow pulse, border animation e scale-in — tudo inline via `style` ou classes Tailwind `animate-`
- Cores fluorescentes: `#39FF14` (verde neon) e `#FFD700` (dourado) para contraste em fundo escuro


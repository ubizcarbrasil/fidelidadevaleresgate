

## Plano: Corrigir contraste dos inputs no modo escuro do carousel de resgate

### Problema
Os campos de entrada (CPF, Nome, Email, etc.) no `RedemptionSignupCarousel` não definem cor de texto nem fundo explicitamente. No modo escuro, o texto fica invisível porque herda a cor clara do tema enquanto o fundo permanece claro.

### Solução

**Arquivo:** `src/components/customer/RedemptionSignupCarousel.tsx`

Adicionar estilização de contraste fixo em todos os 6 inputs do carousel (linhas 180-240):
- `color: '#000'` — texto sempre preto
- `backgroundColor: '#fff'` — fundo sempre branco

Isso segue o padrão já documentado para inputs sensíveis no PWA (conforme regra existente de contraste fixo).

Exemplo da mudança para cada input:
```tsx
style={{ 
  borderColor: brandAlpha(fg, 0.08),
  color: '#000',
  backgroundColor: '#fff',
}}
```

### Sobre o erro "Nenhum cliente teste encontrado"
Esse erro vem do `DemoStoresToggle` (botão de creditar pontos de teste) e não está relacionado ao login do cliente. É uma funcionalidade administrativa separada.

### Arquivos alterados
- `src/components/customer/RedemptionSignupCarousel.tsx` — adicionar contraste fixo nos 6 inputs


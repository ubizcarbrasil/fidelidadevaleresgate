

## Correção: Layout dos botões no card de desafio

### Problema
Os 3 botões (Aceitar, Contraproposta, Recusar) estão numa única linha `flex`, o que causa overflow em telas mobile de 430px — o botão "Recusar" fica cortado/fora do card.

### Solução
Reorganizar os botões em duas linhas quando há aposta de pontos:
- **Linha 1**: "Aceitar" (largura total)
- **Linha 2**: "Contraproposta" e "Recusar" lado a lado (cada um flex-1)

Quando não há aposta (sem botão Contraproposta), manter "Aceitar" e "Recusar" numa única linha.

### Alteração
**Arquivo**: `src/components/driver/duels/DuelChallengeCard.tsx`

Substituir o bloco de botões (linhas 101-136) para usar `flex-col` com sub-rows:

```tsx
{!showCounter ? (
  <div className="flex flex-col gap-2">
    <Button
      onClick={...}
      disabled={...}
      className="w-full gap-1.5"
      size="sm"
    >
      <ShieldCheck className="h-4 w-4" />
      {hasBet ? `Aceitar (${formatPoints(...)} pts)` : "Aceitar"}
    </Button>
    <div className="flex gap-2">
      {hasBet && (
        <Button variant="secondary" className="flex-1 gap-1.5" size="sm">
          <MessageSquare className="h-4 w-4" />
          Contraproposta
        </Button>
      )}
      <Button variant="outline" className="flex-1 gap-1.5" size="sm">
        <Flag className="h-4 w-4" />
        {hasBet ? "Recusar" : "Arregar 😅"}
      </Button>
    </div>
  </div>
) : (...)}
```

Impacto: apenas layout CSS, sem mudança de lógica.


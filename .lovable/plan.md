

## Problema

O card de saldo na Carteira está **invisível** porque o código concatena sufixos hexadecimais (`bb`, `50`) diretamente em valores HSL, gerando CSS inválido como `hsl(217 90% 50%)bb`. Isso faz o gradiente e a sombra não renderizarem.

Linhas problemáticas em `CustomerWalletPage.tsx`:
```
background: `linear-gradient(135deg, ${primary}, ${primary}bb)` // ← inválido
boxShadow: `0 6px 24px -6px ${primary}50`                      // ← inválido
```

## Solução

Usar o helper `withAlpha` já existente no arquivo para gerar transparências HSL válidas:

**Arquivo:** `src/pages/customer/CustomerWalletPage.tsx` (linhas 80-83)

- `background` → `linear-gradient(135deg, ${primary}, ${withAlpha(primary, 0.73)})`
- `boxShadow` → `0 6px 24px -6px ${withAlpha(primary, 0.3)}`

Isso garante que o card terá o gradiente colorido visível com o texto branco legível, e a sombra será aplicada corretamente.


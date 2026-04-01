

# Adicionar botão X para fechar o toast do código de verificação

## Problema
O toast que exibe o código de verificação (6 dígitos) fica visível por 30 segundos sem opção de fechar manualmente.

## Correção

### 1. `src/components/ui/sonner.tsx`
Adicionar `closeButton` globalmente no componente `Sonner`:
```tsx
<Sonner closeButton ... />
```

Isso adiciona um botão X em todos os toasts do app, permitindo fechar qualquer notificação manualmente.

### Alternativa (se quiser só no toast do código)
Em vez de global, adicionar apenas na chamada específica em `DriverVerifyCodeStep.tsx`:
```typescript
toast.info(`Seu código de verificação: ${newCode}`, { duration: 30000, dismissible: true });
```

**Recomendação**: usar a opção global (`closeButton` no Sonner) — é mais consistente e melhora a UX em todo o app.


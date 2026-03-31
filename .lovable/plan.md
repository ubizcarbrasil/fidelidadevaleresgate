

# Pré-preencher dados do motorista no Checkout de Resgate

## Problema
O formulário de checkout já lê `customer.phone` e `customer.cpf`, mas quando esses campos estão vazios no registro do motorista, o formulário fica em branco. O sistema deveria também buscar dados do perfil do usuário autenticado (`auth.users` metadata) como fallback. Além disso, a mensagem "Você precisa de mais 6800 pontos" não usa `formatPoints`.

## Solução

### 1. Melhorar fallback de dados no `DriverRedeemCheckout.tsx`
Adicionar `useAuth()` para acessar `user.user_metadata` e usar como fallback quando o `customer` não tem os dados:

```tsx
const { user } = useAuth();

const [form, setForm] = useState({
  name: customer?.name?.replace(/\[MOTORISTA\]\s*/i, "").replace(/\s*\(D\)\s*$/i, "").trim() 
        || user?.user_metadata?.full_name || "",
  phone: customer?.phone || user?.user_metadata?.phone || user?.phone || "",
  cpf: customer?.cpf || "",
  cep: "",
  ...
});
```

### 2. Corrigir formatação de pontos na mensagem de saldo insuficiente
Na linha 196, aplicar `formatPoints` ao cálculo de pontos faltantes:
```tsx
Você precisa de mais {formatPoints(deal.redeem_points_cost - pointsBalance)} pontos
```

### 3. Limpar sufixo "(D)" do nome
O nome do motorista pode conter "(D)" no final (ex: "CELIO ANTONIO RODRIGUES (D)"). Remover isso junto com a tag `[MOTORISTA]`.

### Arquivo editado
- `src/components/driver/DriverRedeemCheckout.tsx`


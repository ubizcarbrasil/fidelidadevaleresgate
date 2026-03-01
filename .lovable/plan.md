

## Plano: Cadastro inline em carrossel no modal de resgate

### Contexto
Quando o usuário **não autenticado** clica em "Resgatar agora", o modal atual mostra apenas CPF + Confirmar. O pedido é transformar esse modal em um fluxo de cadastro completo em formato carrossel (uma etapa por vez), mantendo o comportamento atual para usuários já logados.

### Fluxo do carrossel (6 etapas)

```text
┌─────┐   ┌──────┐   ┌───────┐   ┌──────────┐   ┌─────┐   ┌───────┐
│ CPF │ → │ Nome │ → │ Email │ → │ Telefone │ → │ OTP │ → │ Senha │
└─────┘   └──────┘   └───────┘   └──────────┘   └─────┘   └───────┘
```

- Cada etapa ocupa a mesma área do modal, com animação slide horizontal (framer-motion)
- Botão "Próximo" avança, indicador de progresso (dots) no topo
- Botão voltar retorna à etapa anterior

### Lógica por etapa

1. **CPF** — input formatado (já existe). Validação: 11 dígitos
2. **Nome** — input text. Validação: não vazio
3. **E-mail** — input email. Validação: formato válido
4. **Telefone** — input tel com máscara (XX) XXXXX-XXXX. Validação: 10-11 dígitos
5. **OTP** — ao avançar do telefone, chama `supabase.auth.signUp()` com os dados coletados (auto_confirm está ativo). Depois envia OTP via `supabase.auth.signInWithOtp()` pelo e-mail para verificação. O usuário digita o código de 6 dígitos
6. **Criar Senha** — input password (min 6 chars). Ao confirmar, chama `supabase.auth.updateUser({ password })` e em seguida executa o resgate automaticamente

### Comportamento para usuário já logado
Nada muda — continua mostrando apenas CPF + Confirmar como hoje.

### Alterações técnicas

#### `CustomerOfferDetailPage.tsx`
- Adicionar estados: `signupStep` (0-5), `signupData` (cpf, name, email, phone, otp, password)
- No modal, se `!customer`: renderizar o carrossel de cadastro em vez do CPF simples
- Se `customer`: manter o fluxo atual (CPF + Confirmar)
- Cada step usa `AnimatePresence` + `motion.div` com `key={step}` para animação de slide
- Após senha criada e login bem-sucedido, o `CustomerContext` auto-cria o registro do customer, e o resgate é executado automaticamente
- Indicador de progresso: 6 dots no topo do modal

#### Fluxo de auth no step 5 (OTP) e 6 (Senha)
- Step 4→5: `supabase.auth.signUp({ email, password: temporária })` + `supabase.auth.signInWithOtp({ email })` para enviar código
- Step 5→6: `supabase.auth.verifyOtp({ email, token, type: 'email' })` para verificar
- Step 6 final: `supabase.auth.updateUser({ password })` com a senha definitiva, salva metadata (name, phone), aguarda `customer` do contexto e executa `handleRedeem` automaticamente

**Simplificação**: como `auto_confirm_email` está ativo, podemos simplificar — fazer `signUp` com email+senha definitiva no passo 6, pular OTP real, e prosseguir direto ao resgate. Porém o usuário pediu OTP explicitamente, então manteremos o fluxo com verificação por e-mail.


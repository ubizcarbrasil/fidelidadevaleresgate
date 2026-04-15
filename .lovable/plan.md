
Objetivo

Mover a verificação do motorista para o último passo do resgate com pontos: primeiro ele preenche os dados, depois clica em comprar/resgatar, e só então aparece a verificação.

Diagnóstico do código atual

- Hoje o fluxo do motorista está invertido em `src/components/driver/DriverRedeemCheckout.tsx`.
- Esse componente exige `DriverVerifyCodeStep` antes mesmo de mostrar o formulário:
  - `if (!verified) return <DriverVerifyCodeStep ... />`
- Por isso a verificação aparece cedo demais.
- O fluxo do cliente em `src/components/customer/CustomerRedeemCheckout.tsx` já está no formato certo e pode servir de referência:
  - formulário
  - clique em confirmar
  - OTP
  - conclusão

Plano de ajuste

1. Refatorar `DriverRedeemCheckout.tsx`
- Trocar o controle atual por etapas explícitas, por exemplo:
  - `form`
  - `otp`
  - `success`
- Remover a lógica que bloqueia a tela com verificação logo na abertura.
- Exibir primeiro o formulário de entrega normalmente.

2. Fazer a validação só após clicar em comprar/resgatar
- No botão final do checkout do motorista:
  - validar saldo
  - validar campos obrigatórios
  - se estiver tudo certo, abrir a etapa de verificação
- O débito de pontos e o RPC `process_product_redemption` só devem acontecer depois da verificação concluída.

3. Adaptar `DriverVerifyCodeStep.tsx` para uso como etapa final
- Manter o componente como tela de verificação reutilizável.
- Abrir essa etapa somente depois do formulário validado.
- Ao validar o código com sucesso, retornar para o `DriverRedeemCheckout` executar o resgate final.
- Remover a exposição do código em toast, que é exatamente o comportamento mostrado na imagem.

4. Preservar o restante do fluxo
- O formulário continua igual.
- O sucesso continua igual.
- Os pontos só são consumidos depois do código correto.
- O botão “Comprar” externo não passa por verificação; a verificação continua apenas no fluxo de compra com pontos.

Arquivos que precisam ser alterados

- `src/components/driver/DriverRedeemCheckout.tsx`
- `src/components/driver/DriverVerifyCodeStep.tsx`

Resultado esperado

Fluxo final do motorista:

```text
Abrir checkout
→ preencher dados
→ clicar em comprar/resgatar
→ abrir verificação
→ código válido
→ concluir resgate
→ tela de sucesso
```

Detalhe técnico

- Não parece exigir mudança de banco.
- É uma correção de frontend e de ordem do fluxo.
- Vou espelhar o comportamento já existente no `CustomerRedeemCheckout`, para manter consistência entre cliente e motorista.

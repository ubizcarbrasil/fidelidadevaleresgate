

## Corrigir botão "Quero ser parceiro" na tela de login

### Problema
A rota `/register-store` está envolvida em `<ProtectedRoute>`, exigindo autenticação. Quando o usuário clica "Quero ser parceiro" na tela de login (onde ainda não está logado), a navegação falha — o `ProtectedRoute` redireciona de volta ao `/auth`.

### Solução
Remover o `<ProtectedRoute>` da rota `/register-store` no `App.tsx`, tornando-a pública. Isso permite que qualquer visitante acesse o formulário de cadastro de parceiro sem precisar estar logado.

O formulário de registro de parceiro já coleta os dados necessários e pode lidar com autenticação internamente se precisar.

### Arquivo modificado

**`src/App.tsx`**
- Alterar a rota de:
  ```tsx
  <Route path="/register-store" element={<ProtectedRoute><StoreRegistrationWizard /></ProtectedRoute>} />
  ```
  Para:
  ```tsx
  <Route path="/register-store" element={<StoreRegistrationWizard />} />
  ```

Apenas uma linha alterada. A rota já está na lista de `publicPaths` (linha 354), então o restante do sistema já a trata como pública.




## Plano: Ativação por URL sem chave de acesso (API Key opcional)

### Problema atual
O formulário exige **3 campos obrigatórios** para ativar uma cidade: chave de acesso (API key), usuário e senha. Porém, quando a ativação é feita por URL (colando o webhook direto no roteador de status da TaxiMachine), a chave de acesso não é necessária — o webhook já identifica a integração pelo `brand_id` + `branch_id` na URL.

O que você precisa é apenas do **usuário e senha** para que o sistema consiga consultar o recibo da corrida na API da TaxiMachine quando ela é finalizada.

### O que será feito

**1. Edge Function `register-machine-webhook`**
- Tornar `api_key` opcional — se não vier, gerar um valor placeholder interno (ex: `url-only-{branch_id}`)
- Manter `basic_auth_user` e `basic_auth_password` como obrigatórios (sem eles não pontua)
- Não tentar registrar webhook automaticamente quando não há API key (pois o usuário cadastra manualmente)

**2. UI — Aba "Por URL" (`MachineIntegrationPage.tsx`)**
- Transformar a aba "Por URL" em um formulário funcional: seletor de cidade + campos de usuário e senha (sem API key)
- Ao ativar, mostra a URL do webhook para o usuário copiar e colar no roteador
- Remover a instrução de "primeiro ative por credenciais"

**3. UI — Aba "Por credenciais"**
- Mantém como está (com os 3 campos) para quem tem a chave de acesso

| Arquivo | Mudança |
|---|---|
| `supabase/functions/register-machine-webhook/index.ts` | API key opcional, gerar placeholder quando ausente, skip webhook registration |
| `src/pages/MachineIntegrationPage.tsx` | Aba URL com formulário de ativação (cidade + usuário + senha), exibir URL após ativar |


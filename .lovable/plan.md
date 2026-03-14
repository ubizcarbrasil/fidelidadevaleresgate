

## Diagnóstico: Recibo retornando 400

O `testBothEndpoints` não captura o **body** da resposta do Recibo, então não sabemos o motivo exato do 400. Pode ser:
- O ID de teste (`100003661`) não ter recibo nessa conta
- O path ou parâmetros do endpoint estarem incorretos
- Algum header adicional necessário

## Plano

1. **Alterar `testBothEndpoints` em `_shared/fetchRideData.ts`** para retornar o `body` da resposta quando o status não for OK, permitindo diagnóstico:

```typescript
recibo: { ok: boolean; status: number; error?: string; body?: string };
request_v1: { ok: boolean; status: number; error?: string; body?: string };
```

Capturar `await res.text()` e incluir os primeiros 500 caracteres no resultado.

2. **Alterar `test-machine-credentials/index.ts`** para exibir o body do erro na mensagem de retorno, facilitando o debug.

3. **Testar novamente** para capturar a mensagem de erro exata do endpoint Recibo e então corrigir o problema real (path, parâmetros, ou ID de teste).


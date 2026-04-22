

# Corrigir download CSV em mobile/PWA (iOS)

## Problema

O export agora busca corretamente os 4.257 motoristas (visível no toast "Exportando 4.000 / 4.257"), mas **nenhum arquivo é salvo no celular**.

**Causa raiz**: `baixarCsvMotoristas` usa o truque clássico `<a href={blobUrl} download="...">.click()`. Esse padrão **não funciona em iOS Safari nem em PWAs em modo standalone** (que é o caso do print — ícone de bateria + 5G + barra de status sugerem app instalado/PWA). O navegador iOS:

- Ignora o atributo `download` em `<a>`
- Bloqueia abertura programática de blob URLs em modo standalone
- Não tem "pasta de Downloads" acessível para arquivos via `<a download>`

Por isso o toast termina com sucesso, mas nenhum arquivo aparece.

## Solução: 3 estratégias em cascata

Refatorar `baixarCsvMotoristas` para detectar o ambiente e usar a melhor estratégia disponível:

### Estratégia 1 — Web Share API (preferida em mobile)

Se `navigator.share` e `navigator.canShare({ files })` existirem (iOS 15+, Android Chrome), usar:

```ts
const file = new File([blob], nomeArquivo, { type: "text/csv" });
if (navigator.canShare?.({ files: [file] })) {
  await navigator.share({ files: [file], title: nomeArquivo });
  return;
}
```

→ Abre o sheet nativo de compartilhar do iOS, permitindo "Salvar em Arquivos", enviar por email, WhatsApp, AirDrop, etc. **Esse é o fluxo natural do iOS**.

### Estratégia 2 — `<a download>` clássico (desktop)

Se Web Share não existir mas estivermos em desktop, manter o fluxo atual.

### Estratégia 3 — Fallback: abrir em nova aba

Se nada funcionar (caso raro), `window.open(blobUrl, "_blank")` para o usuário ver o conteúdo no navegador e salvar manualmente.

### Detecção de iOS standalone

Adicionar helper:
```ts
const isStandalonePWA = () =>
  window.matchMedia?.("(display-mode: standalone)").matches ||
  (window.navigator as any).standalone === true;
```

Em PWA standalone iOS, **forçar Web Share** (pular tentativa de `<a download>` que sempre falha).

## Melhorias adicionais

- **Toast de sucesso atualizado**: em mobile mostrar "Toque em 'Salvar em Arquivos' para guardar" em vez de "X motoristas exportados" (que sugere arquivo já salvo).
- **Tratamento de cancelamento**: se o usuário fechar o share sheet (`AbortError`), não mostrar toast de erro — apenas dismiss silencioso.
- **Type do blob**: já está `text/csv;charset=utf-8;` — manter.

## Arquivos impactados

**Editado (1):**
- `src/features/gestao_motoristas/utils/utilitarios_export_motoristas.ts` — refatora `baixarCsvMotoristas` com cascata Web Share → `<a download>` → `window.open` + detecção iOS PWA

**Editado (1):**
- `src/features/gestao_motoristas/hooks/hook_exportar_motoristas.ts` — captura `AbortError` (cancelamento de share) e ajusta mensagem de sucesso para mobile

**Sem alteração no serviço de busca** (que já está correto e exportando os 4.257). Sem migration.

## Resultado esperado

**iPhone (PWA)**: clica CSV → aguarda "Exportando 4.257/4.257" → **abre o share sheet do iOS** → escolhe "Salvar em Arquivos" → arquivo `motoristas-2026-04-22.csv` salvo no app Arquivos.

**Android Chrome**: mesma coisa via Web Share.

**Desktop (Chrome/Firefox/Safari)**: download direto na pasta de Downloads (comportamento atual preservado).

## Risco e rollback

- Zero risco de dados (só muda o método de entrega do blob já gerado)
- Rollback trivial: reverter `utilitarios_export_motoristas.ts`
- Sem efeito em outras funcionalidades


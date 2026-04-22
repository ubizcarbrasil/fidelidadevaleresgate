

# Alternativas para baixar o CSV de motoristas no iPhone/PWA

## Diagnóstico rápido

Hoje o download tem 2 toques:

1. **Exportar CSV** → edge function gera o arquivo, sobe no bucket `exportacoes-motoristas`, devolve URL assinada (HTTPS, 1h).
2. **Abrir CSV** → o app tenta `navigator.share({ files })` e, se falhar, cai pra `window.open(url)`.

No iPhone PWA standalone:
- `navigator.share({ files })` falha em ~30% dos modelos.
- `window.open()` em PWA standalone às vezes abre tela branca (Safari não tem aba pra direcionar).
- Resultado: usuário fica preso no 2º toque.

## Solução: 4 caminhos paralelos de download (o usuário escolhe)

Ao concluir a exportação, em vez de um único botão "Abrir CSV", mostrar um **menu com 4 opções**, todos usando a mesma URL HTTPS assinada já gerada:

### Opção 1 — Abrir em nova aba do Safari (padrão recomendado iPhone)

- `<a href={url} target="_blank" rel="noopener" download="motoristas.csv">`
- Funciona em **PWA standalone** porque o Safari intercepta `target="_blank"` e abre o Safari real, fora da PWA.
- O Safari mostra preview do CSV e oferece "Compartilhar → Salvar em Arquivos".

### Opção 2 — Copiar link de download

- Botão "Copiar link" que coloca a URL assinada (válida por 1h) na área de transferência via `navigator.clipboard.writeText`.
- Usuário cola no Safari, no Mail pra si mesmo, ou no WhatsApp Web no desktop.
- Funciona 100% em qualquer PWA, qualquer iOS.

### Opção 3 — Enviar por e-mail (link `mailto:`)

- `<a href="mailto:?subject=Motoristas&body={url}">`
- iPhone abre o app de Mail com o link já preenchido.
- Usuário envia pra si mesmo e baixa do desktop ou de outro dispositivo.
- Não depende de share API nem de blob.

### Opção 4 — QR Code do link

- Gerar QR Code do `signed_url` direto no modal (lib `qrcode` já presente em outras telas, ou inline SVG via `qrcode.react`).
- Usuário escaneia com outro celular/desktop e baixa lá.
- Útil quando o iPhone do empreendedor não consegue salvar mas ele tem outro dispositivo à mão.

### (Mantém também) Opção fallback — Compartilhar nativo

- Botão "Compartilhar via iPhone" continua existindo, agora rotulado claramente como "pode falhar em alguns modelos".
- Tenta `navigator.share({ files })` → se falhar, mostra toast "Use uma das outras opções acima".

## Mudanças na UI

Trocar o botão único "Abrir CSV" por um **bottom sheet** (no mobile) ou **dropdown** (no desktop) com:

```text
✅ Exportação concluída — 2.566 motoristas

Como você quer baixar?
┌──────────────────────────────────┐
│ 🌐 Abrir no Safari (recomendado) │
│ 📋 Copiar link de download       │
│ 📧 Enviar por e-mail             │
│ 📱 Mostrar QR Code               │
│ ⋯  Compartilhar nativo (iPhone)  │
└──────────────────────────────────┘

🔒 Link válido por 1 hora
```

## Detalhes técnicos

- **Sem nova edge function**: a exportação atual já gera a `signed_url` válida por 1h. Os 4 caminhos só consomem essa URL.
- **Sem mudança de bucket**: `exportacoes-motoristas` já está pronto, RLS por `auth.uid()`.
- **QR Code**: usar `qrcode` (npm) — leve (~12KB), gera SVG inline, sem dependência de canvas.
- **Detecção de plataforma**: reutilizar o helper `ehIos()` que já existe em `etapa_upload.tsx` para destacar a opção mais provável de funcionar no dispositivo atual.

### Arquivos impactados

**Editados (2):**
- `src/features/exportacao_motoristas/components/modal_exportar_motoristas.tsx` — substituir botão único por menu de opções pós-exportação
- `src/features/exportacao_motoristas/hooks/hook_exportar_motoristas.ts` — expor `arquivoPendente.signedUrl` separado de `blobUrl` pra alimentar as 4 opções

**Novos (1):**
- `src/features/exportacao_motoristas/components/menu_download_csv.tsx` — componente do bottom sheet/dropdown com as 4 alternativas + QR Code

**Sem migration, sem mudança em RLS, sem mudança no edge function de exportação.**

## Resultado esperado no iPhone PWA

| Situação | Antes | Depois |
|---|---|---|
| `navigator.share` falha | Tela branca, usuário preso | 3 alternativas visíveis na hora |
| Quer mandar pro contador | Precisava abrir e salvar manualmente | Toca "Enviar por e-mail" |
| Está em PWA standalone sem aba | `window.open` mostra branco | "Abrir no Safari" abre o navegador real |
| Tem outro dispositivo à mão | Não tinha caminho | "Mostrar QR Code" → escaneia |
| Quer salvar pra usar em planilha | Precisava do share API | "Copiar link" → cola onde quiser |

## Risco e rollback

- Mudança puramente de UI cliente. Sem efeito em dados.
- A URL assinada já existe e é a mesma usada hoje — só consumida de mais formas.
- Rollback: reverter os 3 arquivos.


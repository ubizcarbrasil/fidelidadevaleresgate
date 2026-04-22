
# Corrigir definitivamente o CSV no iPhone/PWA e adicionar regressões automáticas

## Problema atual

O fluxo ainda depende de um caminho frágil no mobile:

- `useExportarMotoristas` guarda um `Blob` em memória (`arquivoPendente`) e exige um 2º toque.
- No 2º toque, `baixarCsvMotoristas()` tenta `navigator.share({ files })`.
- Se o iPhone/PWA não aceitar compartilhamento de arquivo naquele contexto, o código **bloqueia todos os fallbacks** e retorna erro:
  `Não foi possível abrir o compartilhamento nativo...`
- O caminho antigo com `blob:` / `window.open()` é justamente o que tende a gerar a tela branca no iOS standalone.

Ou seja: hoje o app consegue montar o CSV, mas a entrega do arquivo ao iPhone continua dependente de APIs instáveis para PWA standalone.

## Solução definitiva

### 1. Trocar a entrega do CSV de `Blob` local por arquivo real com URL HTTPS
Implementar um fluxo em que o CSV final vira um arquivo hospedado temporariamente no backend, e a tela passa a trabalhar com **URL assinada** em vez de `Blob` em memória.

### 2. Novo fluxo de exportação
Na prática:

1. Usuário toca em **CSV**
2. O sistema busca todos os motoristas e gera o CSV
3. O CSV é enviado para armazenamento temporário no backend
4. O frontend recebe uma **URL HTTPS**
5. O botão muda para **Abrir CSV**
6. No iPhone/PWA, o 2º toque abre essa URL real, sem `blob:` e sem depender de `share(files)`

### 3. Regra por plataforma
- **iPhone / PWA standalone**: usar URL HTTPS como caminho principal
- **Desktop**: pode continuar baixando direto
- **Mobile com share compatível**: `share({ url })` pode ser opcional, mas nunca obrigatório
- **Nunca mais usar `window.open(blobUrl)` no iOS/PWA**

## Implementação

### Frontend
Refatorar a exportação para trocar o estado atual:

- de `arquivoPendente: { blob, nomeArquivo... }`
- para algo como `arquivoPendente: { url, nomeArquivo, expiraEm... }`

Ajustes:
- `useExportarMotoristas`
  - gerar o CSV
  - enviar o arquivo para armazenamento temporário
  - guardar a URL assinada
  - no 2º toque, abrir a URL real
- `utilitarios_export_motoristas.ts`
  - remover o caminho dependente de `blob:` no iPhone/PWA
  - separar claramente:
    - abrir URL HTTPS
    - baixar em desktop
    - compartilhar URL quando suportado
- `DriverManagementPage.tsx`
  - botão alterna entre:
    - `Exportar CSV`
    - `Preparando CSV...`
    - `Abrir CSV`
  - manter feedback claro por toast

### Backend
Adicionar suporte para artefato temporário de exportação:

- criar área de armazenamento temporário para CSVs
- salvar o arquivo com caminho por usuário/data
- gerar URL assinada com expiração curta
- opcionalmente sobrescrever/reaproveitar export anterior recente para evitar lixo

Se o armazenamento exigir configuração de acesso, incluir isso no backend com políticas mínimas e seguras.

### PWA / cache
Se a abertura do arquivo usar rota same-origin nova, incluir essa rota na proteção do PWA para evitar interceptação indevida do service worker e fazer bump do `cacheId`.
Se a entrega for por URL externa/assinada, manter o PWA sem interceptar esse caminho.

## Testes automatizados

### 1. Testes unitários
Criar testes para `utilitarios_export_motoristas.ts` cobrindo:

- detecção de iPhone / standalone
- caminho de iPhone PWA abre **URL HTTPS**
- garantia de que **não usa** `window.open("blob:...")` nesse cenário
- fallback desktop continua funcionando

### 2. Testes do hook
Criar testes para `useExportarMotoristas` cobrindo:

- exportação bem-sucedida gera estado `arquivoPendente`
- 2º toque consome a URL pronta
- erro no upload / geração mostra toast correto
- cancelamento de share não vira erro fatal
- após abrir com sucesso, o estado pendente é limpo

### 3. Cenário E2E / regressão
Adicionar cenário automatizado específico para o fluxo pedido:

**Cenário
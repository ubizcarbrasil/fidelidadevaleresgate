## Diagnóstico (com evidência)

Baixei o bundle JavaScript que está servido em `https://app.valeresgate.com.br` (`assets/App-BnODURvJ.js`) e procurei pelas strings da rota nova:

```
/ofertas         → não encontrado
PaginaUbizOfertas → não encontrado
Ubiz             → não encontrado
```

Conclusão: a rota `/ofertas` **existe no código-fonte** (`src/App.tsx` linha 198 e 388‑416) mas **não existe na build publicada**. Por isso o domínio responde 404 / cai no `/auth`.

Isso é diferente do que eu havia dito antes: não é cache do PWA, é a publicação que ficou para trás.

## Plano

### 1. Publicar a versão atual (ação principal)
A rota `/ofertas` só vai funcionar em `app.valeresgate.com.br` depois que o botão **Publicar** (canto superior direito do editor) for clicado e a publicação concluída. Sem isso, qualquer ajuste extra é inútil — o domínio continuará servindo o bundle antigo.

### 2. Melhorar a página `NotFound` para ajudar o diagnóstico
Para o futuro, alterar `src/pages/NotFound.tsx` adicionando:
- Mostrar o caminho que o usuário tentou (ex.: "Você tentou acessar `/ofertas`")
- Botão "Tentar novamente" que força reload sem cache
- Mensagem mais amigável em português

### 3. Adicionar verificação de versão no boot
Criar um pequeno utilitário em `src/lib/buildVersionCheck.ts` que:
- Lê uma constante `BUILD_ID` injetada no build
- A cada 5 minutos compara com o `BUILD_ID` do `index.html` remoto
- Se diferente, mostra um toast "Nova versão disponível — recarregar"

Isso evita que usuários do PWA fiquem presos numa build antiga depois de uma publicação.

### 4. Ajustar mensagem do bloco "Link público" no painel
Em `src/features/ubiz_ofertas/components/link_publico_ofertas.tsx`, adicionar um aviso amarelo abaixo do link:
> "Após ativar este modo, lembre-se de clicar em **Publicar** para que o link funcione no domínio personalizado."

## Sobre o link

O link continua sendo `https://app.valeresgate.com.br/ofertas` — ele vai funcionar imediatamente após a publicação (passo 1). Você também pode testar agora mesmo no preview, que já está atualizado:

`https://id-preview--3ff47979-b8b4-4666-bfef-7987c2d119c3.lovable.app/ofertas`

## Arquivos a editar

- `src/pages/NotFound.tsx` — mensagem amigável + botão de reload forçado
- `src/lib/buildVersionCheck.ts` — novo, polling de versão
- `src/main.tsx` — inicializar o checker
- `src/features/ubiz_ofertas/components/link_publico_ofertas.tsx` — aviso de publicação

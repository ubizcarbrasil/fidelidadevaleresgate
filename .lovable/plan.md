
Objetivo: fazer o link do motorista abrir no Android mesmo quando o usuário recebeu/copiou um link antigo ou gerado no domínio errado.

Do I know what the issue is? Sim.

Problema exato:
- A correção no `/driver` já foi aplicada: `DriverPanelPage.tsx` usa a view pública e isso resolve o acesso anônimo.
- O erro continua no Android porque o link que está sendo aberto usa o host `www.valeresgata.ubizcar.com.br`.
- Hoje esse domínio está mapeado no backend para a marca Ubiz Car, não para Ubiz Resgata.
- Além disso, vários pontos do app ainda geram links públicos usando `window.location.origin`, então a Ubiz Resgata pode herdar o domínio atual errado ao copiar/compartilhar links.
- No Android, isso piora por causa de cache/PWA: o usuário tende a reabrir sempre o mesmo host já salvo/copiado.

Plano de implementação

1. Centralizar a URL pública correta da marca
- Ajustar `src/lib/publicShareUrl.ts` para resolver a origem canônica da marca nesta ordem:
  1. `driver_public_base_url` configurada
  2. domínio ativo/principal da marca
  3. domínio publicado padrão do app
- Parar de depender de `window.location.origin` para links públicos de motorista.

2. Corrigir todos os geradores de link
- Atualizar para usar a mesma lógica central:
  - `src/features/pagina_links/pagina_links.tsx`
  - `src/components/dashboard/DashboardQuickLinks.tsx`
  - `src/pages/DriverPanelConfigPage.tsx`
  - qualquer share/copy do motorista
- Resultado: Ubiz Resgata sempre gera link próprio/canônico, mesmo se o admin estiver navegando em outro domínio.

3. Auto-corrigir links antigos no próprio `/driver`
- Em `src/pages/DriverPanelPage.tsx`, depois de carregar a marca:
  - calcular a origem canônica da marca
  - se o host atual não bater com a origem correta, redirecionar automaticamente preservando rota e querystring
- Isso “cura” links antigos já enviados para Android.

4. Alinhar a configuração pública da Ubiz Resgata
- Configurar a base pública da Ubiz Resgata para um endereço correto:
  - ou domínio publicado padrão
  - ou domínio white-label próprio da Ubiz Resgata
- Hoje ela está sem `driver_public_base_url`, então o sistema cai em fallback e pode usar o host errado.

5. Forçar atualização mais confiável no Android
- Endurecer a recuperação de cache/PWA para evitar bundle antigo:
  - revisar `index.html` e o fluxo de SW
  - subir a chave/versionamento da limpeza para forçar refresh após deploy
- Isso reduz o risco de o Android continuar servindo JS antigo.

Arquivos envolvidos
- `src/pages/DriverPanelPage.tsx`
- `src/lib/publicShareUrl.ts`
- `src/features/pagina_links/pagina_links.tsx`
- `src/components/dashboard/DashboardQuickLinks.tsx`
- `src/pages/DriverPanelConfigPage.tsx`
- `index.html`
- configuração de domínio/base pública da marca no backend

Detalhes técnicos
- O problema principal agora não é mais RLS do `/driver`.
- O problema é “host canônico errado + geração de links baseada no domínio atual”.
- O print confirma isso: o usuário abriu `www.valeresgata.ubizcar.com.br`, mas esse host está associado a outra marca.
- A solução mais robusta é:
  - gerar links com origem canônica por marca
  - redirecionar automaticamente quando um link abrir no host errado
  - invalidar cache antigo no Android

Validação após implementar
1. Gerar novo link da Ubiz Resgata na página `/links`
2. Abrir no Android em aba anônima
3. Abrir no Android em navegador normal
4. Abrir um link antigo com host errado e confirmar redirecionamento automático
5. Confirmar que a tela de CPF abre sem “Marca não encontrada”

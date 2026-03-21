
Objetivo: fazer o link do Achadinhos abrir publicamente na web sem cair em domínio quebrado.

Problema encontrado
- Hoje existe um registro em `brand_domains` para `123456.valeresgate.com` vinculado à marca `db15bd21-9137-4965-a0fb-540d8e8b26f1`.
- Esse domínio está sendo tratado como “público” em partes do admin, mas o DNS dele não está respondendo fora da aplicação.
- Resultado: o sistema continua exibindo/copiando um link que parece oficial, porém quebra para terceiros.
- O `/driver` em si já está público; o erro está no domínio usado no link.

O que vou implementar
1. Parar de usar `brand_domains` como fonte “confiável” do link público do Achadinhos
- `is_primary`/`is_active` não garantem que o domínio exista de verdade na internet.
- O app não deve mais divulgar automaticamente `123456.valeresgate.com` só porque há um registro salvo.

2. Criar uma URL pública oficial do Achadinhos, configurável pela marca
- Adicionar no painel de configuração do motorista um campo como:
  - “URL pública do Achadinhos”
- Exemplo de valor:
  - `https://fidelidadevaleresgate.lovable.app`
  - ou, quando o DNS estiver pronto, `https://123456.valeresgate.com`
- Essa URL será salva em `brand_settings_json` e passará a ser a única base usada para compartilhar/copiar/abrir.

3. Centralizar toda a geração do link
- Ajustar `src/lib/publicShareUrl.ts` para montar sempre:
  - `URL_PUBLICA_OFICIAL/driver?brandId=...`
  - com suporte a `dealId` e `categoryId`
- Ordem de fallback:
  1. URL pública configurada na marca
  2. `window.location.origin`

4. Corrigir todos os pontos que ainda exibem/copiam link errado
- Dashboard
- Configuração do Painel do Motorista
- Botões de compartilhar de categoria/produto/marketplace
- Assim todo lugar passa a entregar exatamente o mesmo link público.

5. Remover o comportamento enganoso da Dashboard
- A área “Links Úteis” hoje ainda monta `productionUrl` com `brand_domains`.
- Vou trocar isso para usar a URL pública oficial configurada.
- Também vou remover/ajustar o indicativo atual de domínio para não sugerir um endereço quebrado.

Importante
- Código não consegue “fazer existir” `123456.valeresgate.com` se o DNS não estiver configurado.
- Então a correção terá dois efeitos:
  - imediato: o sistema passa a compartilhar um link público funcional do Achadinhos
  - opcional depois: quando o domínio próprio estiver realmente ativo, basta colocá-lo como URL pública oficial

Arquivos envolvidos
- `src/lib/publicShareUrl.ts`
- `src/pages/DriverPanelConfigPage.tsx`
- `src/pages/Dashboard.tsx`
- `src/components/driver/DriverMarketplace.tsx`
- `src/components/driver/DriverCategoryPage.tsx`
- `src/components/customer/AchadinhoDealDetail.tsx`
- `src/components/customer/AchadinhoCategoryPage.tsx`
- `src/components/customer/AchadinhoDealsOverlay.tsx`

Resultado esperado
- O Achadinhos passa a ter um link público estável e acessível por qualquer pessoa na web
- O admin deixa de copiar/exibir `123456.valeresgate.com` enquanto ele estiver quebrado
- Compartilhamentos passam a abrir corretamente o `/driver` público com `brandId`, `categoryId` e `dealId` quando houver

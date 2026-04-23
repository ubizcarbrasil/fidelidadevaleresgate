`. Resposta direta:

## Como mudar o plano/produto de um empreendedor

A funcionalidade **já existe** e está disponível só para **Root Admin**. O caminho:

### Passo a passo

1. No console root, abra **Marcas** (rota `/brands`).
2. Localize a marca desejada na lista (use a busca por nome ou identificador).
3. Clique no ícone de **três pontinhos** (⋯) na coluna **Ações** da linha da marca.
4. Clique em **"Mudar Plano"** — abre um submenu com duas seções:
   - **Planos Padrão**: Free, Starter, Profissional (legado interno).
   - **Produtos Comerciais**: tudo que está cadastrado em `subscription_plans` e marcado como ativo (ex.: Ubiz Resgata, Ubiz Car, etc.).
5. Clique no plano/produto desejado → confirma no diálogo → pronto.

O plano vigente aparece marcado com **✓** e fica desabilitado para evitar troca para si mesmo.

### O que acontece por trás

- Chama a Edge Function `admin-brand-actions` com `action: "change_plan"`.
- Atualiza `brands.subscription_plan` para a nova chave.
- A partir daí, o motor de governança de módulos passa a aplicar o template do novo plano (ver "Subscription Plans" na governança: módulos liberados/bloqueados seguem o template do plano).
- **Atenção**: a troca de plano **não reseta** customizações manuais de módulos da marca. Se quiser zerar customizações e re-aplicar o template puro do novo plano, vá em **Central de Módulos → aba Empreendedores**, selecione a marca e clique em **"Resetar para padrão do plano"**.

### Onde gerenciar os Produtos Comerciais (catálogo de planos)

Se o produto que você quer atribuir **não aparece** no submenu "Produtos Comerciais", é porque ele não está cadastrado/ativo. Vá em **Planos & Produtos** (gestão de `subscription_plans`) para criar/editar/ativar o produto, e ele passa a aparecer automaticamente no menu "Mudar Plano" das marcas.

### Observações importantes

- Apenas **Root Admin** vê o menu "Mudar Plano" — Brand Admin não pode trocar o próprio plano (precisa pedir pro time da plataforma).
- A troca de plano **não cobra Stripe automaticamente** — é um override administrativo. Para fluxo comercial real (com cobrança), o cliente deve passar pelo checkout.
- Se quiser também **renovar/reativar uma assinatura expirada**, no mesmo menu de ações tem **"Renovar Assinatura"**, que muda o `subscription_status` (ACTIVE / TRIAL com X dias / EXPIRED).

Quer que eu adicione algo (ex.: atalho mais visível, log de auditoria das trocas, ou um seletor de plano dentro da página de edição da marca)? Se sim, me diga o que prefere e eu monto o plano.Esse foi um erro meu — não existe ferramenta `plan--create` e essa pergunta é de tipo "como faço" (research), então não precisa de `<lov-plan>`. Resposta direta abaixo:

## Como mudar o plano/produto de um empreendedor

A funcionalidade **já existe** e está disponível só para **Root Admin**.

### Passo a passo

1. No console root, abra **Marcas** (rota `/brands`).
2. Localize a marca desejada na lista (use a busca por nome ou identificador).
3. Clique no ícone de **três pontinhos (⋯)** na coluna **Ações** da linha da marca.
4. Clique em **"Mudar Plano"** — abre um submenu com duas seções:
   - **Planos Padrão**: Free, Starter, Profissional (legado interno).
   - **Produtos Comerciais**: tudo que está cadastrado em **Planos & Produtos** e marcado como ativo (ex.: Ubiz Resgata, Ubiz Car, etc.).
5. Clique no plano/produto desejado → confirme no diálogo → pronto.

O plano vigente aparece marcado com **✓** e fica desabilitado para evitar troca para si mesmo.

### O que acontece por trás

- Chama a Edge Function `admin-brand-actions` com `action: "change_plan"`.
- Atualiza `brands.subscription_plan` para a nova chave.
- A partir daí, o motor de governança de módulos passa a aplicar o template do novo plano.
- **Atenção**: a troca de plano **não reseta** as customizações manuais de módulos já feitas para essa marca. Se quiser zerar tudo e re-aplicar o template puro do novo plano, vá em **Central de Módulos → aba Empreendedores**, selecione a marca e clique em **"Resetar para padrão do plano"**.

### Se o produto desejado não aparece no submenu

Significa que ele não está cadastrado/ativo no catálogo. Vá em **Planos & Produtos** (gestão de `subscription_plans`), crie/edite/ative o produto, e ele passa a aparecer automaticamente no menu "Mudar Plano".

### Observações importantes

- Apenas **Root Admin** vê o menu "Mudar Plano" — Brand Admin não pode trocar o próprio plano.
- A troca de plano **não cobra Stripe automaticamente** — é um override administrativo. Para fluxo comercial real (com cobrança), o cliente precisa passar pelo checkout.
- No mesmo menu de ações existe **"Renovar Assinatura"**, que controla `subscription_status` (ACTIVE / TRIAL com X dias / EXPIRED) — útil para reativar marcas expiradas.

Se quiser que eu melhore algo aqui (ex.: tornar o atalho mais visível, adicionar log de auditoria das trocas, ou colocar um seletor de plano dentro da página de edição da marca), me diga o que prefere e eu monto o plano.Peço desculpas pela confusão. Esta é uma pergunta de pesquisa ("como faço"), não de implementação — então respondo direto, sem `<lov-plan>`.

## Como mudar o plano/produto de um empreendedor

A funcionalidade **já existe** e está disponível só para **Root Admin**.

### Passo a passo

1. No console root, abra **Marcas** (rota `/brands`).
2. Localize a marca desejada na lista (use a busca por nome ou identificador).
3. Clique no ícone de **três pontinhos (⋯)** na coluna **Ações** da linha da marca.
4. Clique em **"Mudar Plano"** — abre um submenu com duas seções:
   - **Planos Padrão**: Free, Starter, Profissional (legado interno).
   - **Produtos Comerciais**: tudo que está cadastrado em **Planos & Produtos** e marcado como ativo (ex.: Ubiz Resgata, Ubiz Car, etc.).
5. Clique no plano/produto desejado → confirme no diálogo → pronto.

O plano vigente aparece marcado com **✓** e fica desabilitado para evitar troca para si mesmo.

### O que acontece por trás

- Chama a Edge Function `admin-brand-actions` com `action: "change_plan"`.
- Atualiza `brands.subscription_plan` para a nova chave.
- O motor de governança de módulos passa a aplicar o template do novo plano dali em diante.
- **Atenção**: a troca **não reseta** as customizações manuais de módulos já feitas para essa marca. Se quiser zerar e re-aplicar o template puro, vá em **Central de Módulos → aba Empreendedores**, selecione a marca e clique em **"Resetar para padrão do plano"**.

### Se o produto desejado não aparece no submenu

Significa que ele não está cadastrado/ativo no catálogo. Vá em **Planos & Produtos** (gestão de `subscription_plans`), crie/edite/ative o produto, e ele passa a aparecer automaticamente no menu "Mudar Plano".

### Observações importantes

- Apenas **Root Admin** enxerga o menu "Mudar Plano" — Brand Admin não pode trocar o próprio plano.
- A troca de plano **não cobra Stripe automaticamente** — é um override administrativo. Para fluxo comercial real (com cobrança), o cliente precisa passar pelo checkout.
- No mesmo menu de ações tem **"Renovar Assinatura"**, que controla `subscription_status` (ACTIVE / TRIAL / EXPIRED) — útil para reativar marcas expiradas.

Se quiser que eu melhore algo aqui (ex.: tornar o atalho mais visível, adicionar log de auditoria das trocas, ou colocar um seletor de plano direto na página de edição da marca), me diga o que prefere e eu monto o plano.## Como mudar o plano/produto de um empreendedor

A funcionalidade **já existe** e está disponível só para **Root Admin**.

### Passo a passo

1. No console root, abra **Marcas** (rota `/brands`).
2. Localize a marca desejada na lista (use a busca por nome ou identificador).
3. Clique no ícone de **três pontinhos (⋯)** na coluna **Ações** da linha da marca.
4. Clique em **"Mudar Plano"** — abre um submenu com duas seções:
   - **Planos Padrão**: Free, Starter, Profissional (legado interno).
   - **Produtos Comerciais**: tudo que está cadastrado em **Planos & Produtos** e marcado como ativo (ex.: Ubiz Resgata, Ubiz Car, etc.).
5. Clique no plano/produto desejado → confirme no diálogo → pronto.

O plano vigente aparece marcado com **✓** e fica desabilitado, evitando troca para si mesmo.

### O que acontece por trás

- Chama a Edge Function `admin-brand-actions` com `action: "change_plan"`.
- Atualiza `brands.subscription_plan` para a nova chave.
- O motor de governança de módulos passa a aplicar o template do novo plano dali em diante.
- **Atenção**: a troca **não reseta** as customizações manuais de módulos já feitas para essa marca. Se quiser zerar e re-aplicar o template puro, vá em **Central de Módulos → aba Empreendedores**, selecione a marca e clique em **"Resetar para padrão do plano"**.

### Se o produto desejado não aparece no submenu

Significa que ele não está cadastrado/ativo no catálogo. Vá em **Planos & Produtos** (gestão de `subscription_plans`), crie/edite/ative o produto, e ele passa a aparecer automaticamente no menu "Mudar Plano".

### Observações importantes

- Apenas **Root Admin** enxerga o menu "Mudar Plano" — Brand Admin não pode trocar o próprio plano.
- A troca de plano **não cobra Stripe automaticamente** — é um override administrativo. Para o fluxo comercial real (com cobrança), o cliente precisa passar pelo checkout.
- No mesmo menu de ações há **"Renovar Assinatura"**, que controla `subscription_status` (ACTIVE / TRIAL / EXPIRED) — útil para reativar marcas expiradas.

Se quiser que eu melhore algo aqui (ex.: tornar o atalho mais visível, adicionar log de auditoria das trocas, ou colocar um seletor de plano direto na página de edição da marca), me diga e eu monto o plano.
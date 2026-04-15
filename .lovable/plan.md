
## Diagnóstico confirmado

Verifiquei o estado atual e a configuração já está correta no backend:

- `affiliate_deals` da marca = `false`
- `driver_hub` da marca = `false`
- `branch_settings_json.enable_achadinhos_module` da cidade = `false`

Ou seja: o problema não é mais “qual toggle desligar”. O problema agora é o front do painel do motorista ainda permitir a exibição em alguns cenários.

## O que vou corrigir

### 1. Endurecer a lógica do painel do motorista
Hoje o `DriverPanelPage.tsx` ainda usa defaults permissivos durante carregamento/resolução:

- `brandAchadinhosEnabled ?? true`
- branch sem carregar ainda acaba permitindo exibição
- `driver_hub` e `achadinhos` não ficam “fail-safe”

Vou ajustar para comportamento seguro:

```text
Se ainda não carregou módulo/cidade => não exibe Achadinhos
Se módulo estiver desligado => não exibe
Se Home do Motorista estiver desligada => nunca abre a Home Hub
```

### 2. Bloquear o Achadinhos de ponta a ponta
Mesmo com o flag desligado, vou garantir que o ecossistema inteiro do motorista respeite isso:

- busca
- banners
- “Novas Ofertas”
- “Resgatar com Pontos”
- CTA “Ganhe pontos comprando no ML”
- categorias e cards de ofertas
- queries de `affiliate_deals`

### 3. Remover brechas entre Home e Marketplace
Vou alinhar os dois fluxos:

- `DriverHomePage.tsx`
- `DriverMarketplace.tsx`

para que ambos obedeçam exatamente a mesma regra final de visibilidade.

## Arquivos que serão ajustados

- `src/pages/DriverPanelPage.tsx`
  - tornar `driver_hub` e `affiliate_deals` fail-safe
  - esperar resolução dos dados antes de decidir renderização
  - impedir Home Hub quando `driver_hub = false`

- `src/components/driver/DriverMarketplace.tsx`
  - desativar queries e blocos de Achadinhos quando desligado
  - esconder CTA do ML, banners, vitrines e categorias
  - evitar abertura de conteúdos de oferta por estado residual

- `src/components/driver/home/DriverHomePage.tsx`
  - garantir que a Home não monte partes de Achadinhos quando desligado

- `src/components/driver/home/QuickActionCards.tsx`
  - separar o card “Ganhe pontos comprando no ML” para ele também obedecer ao toggle

## Resultado esperado

Depois da correção:

```text
affiliate_deals = false
+ enable_achadinhos_module = false
=> nenhum bloco de Achadinhos aparece no painel do motorista

driver_hub = false
=> a Home do Motorista não aparece; abre somente o fluxo permitido
```

## Detalhe técnico importante

Não precisa mudar banco nem configuração.  
O backend já está consistente. A correção é 100% no front para fechar defaults permissivos e renderizações residuais.

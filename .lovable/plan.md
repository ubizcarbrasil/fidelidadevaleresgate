
# Corrigir erro do link do motorista no Android

## O que identifiquei

Do I know what the issue is? Sim.

O texto da tela do print é exatamente o erro do `src/pages/DriverPanelPage.tsx`. Hoje essa página ainda busca a marca direto em `brands`:

```ts
supabase.from("brands").select("*").eq("id", brandId)
```

Como essa rota é pública e no Android o usuário abre sem sessão, a RLS bloqueia a leitura e a tela cai em:

```ts
"Marca não encontrada para o ID informado."
```

Também encontrei um segundo ponto importante:
- o domínio do print `valeresgata.ubizcar.com.br` está vinculado hoje à marca **Ubiz Car**
- a marca **Ubiz Resgata** não tem domínio próprio configurado nessa base

Então existem 2 ajustes separados:
1. corrigir a leitura pública da marca no `/driver`
2. alinhar o domínio/link público da Ubiz Resgata, se vocês quiserem usar domínio próprio

## Plano de implementação

### 1. Corrigir a rota `/driver` para funcionar sem login
No arquivo `src/pages/DriverPanelPage.tsx`:
- trocar a busca da marca para usar `public_brands_safe`
- filtrar por `is_active = true`
- manter fallback para `brands` apenas se fizer sentido em sessão autenticada

Exemplo de direção:
```ts
const { data: b } = await supabase
  .from("public_brands_safe")
  .select("*")
  .eq("id", brandId)
  .eq("is_active", true)
  .maybeSingle();
```

### 2. Manter o carregamento da filial compatível com acesso público
Revisar o trecho que carrega `branches` em `DriverPanelPage.tsx` para:
- continuar funcionando anonimamente
- tratar melhor caso `branchId` não exista ou a filial não venha
- evitar erro silencioso no primeiro acesso mobile

### 3. Corrigir o link público da Ubiz Resgata
Como o domínio do print pertence à **Ubiz Car**, vou ajustar uma destas opções conforme a configuração atual desejada:
- usar o domínio publicado padrão para a Ubiz Resgata
- ou configurar um domínio/base pública própria da Ubiz Resgata no backend

Se a intenção for que **Ubiz Resgata** tenha link próprio, preciso alinhar:
- `brand_domains`
- e/ou `brand_settings_json.driver_public_base_url`

## Resultado esperado

Depois da correção:
- o link do motorista abre no Android mesmo sem login prévio
- a tela de CPF do motorista aparece normalmente
- não aparece mais “Marca não encontrada para o ID informado”
- os links passam a apontar para a marca/domínio corretos

## Arquivos e dados envolvidos

- `src/pages/DriverPanelPage.tsx`
- configuração pública da marca no backend (`brands` / `brand_domains`)

## Validação após implementar

Vou validar estes cenários:
1. abrir `/driver?brandId=...` em acesso anônimo
2. abrir no mobile/Android sem sessão salva
3. testar com domínio publicado padrão
4. testar com domínio próprio, se a Ubiz Resgata for configurada com um

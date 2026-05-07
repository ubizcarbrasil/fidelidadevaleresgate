## Objetivo
Tornar o **Ubiz Ofertas** fácil de usar: explicar como configurar e exibir o **link público** dentro do painel da Marca, com botões para copiar e abrir.

## Situação atual
- Toggle e título da vitrine já existem em `src/components/BrandThemeEditor.tsx` (seção "Modos de entrada"), salvando em `brand_settings_json.enable_ubiz_ofertas_mode` e `ubiz_ofertas_title`.
- Rota pública `/ofertas` já registrada em `src/App.tsx`.
- O painel **não mostra** o link público nem instruções de uso. O administrador não tem como descobrir/copiar a URL.

## Como configurar (passo a passo que será exibido na UI)
1. Marca → Aparência/Tema → seção **"Modos de entrada"**.
2. Ativar o toggle **"Ubiz Ofertas (vitrine pública)"**.
3. Definir o **Título exibido na vitrine** (opcional).
4. Salvar. A vitrine fica imediatamente disponível no link público da marca.

## Mudanças no painel

### 1. Card "Link público da vitrine" em `BrandThemeEditor.tsx`
Logo abaixo do toggle/título do Ubiz Ofertas, adicionar um bloco que aparece apenas quando `enable_ubiz_ofertas_mode === true`:

- Resolve o domínio público da marca via `getPublicOrigin(brandId)` (já existe em `src/lib/publicShareUrl.ts`) — usa `driver_public_base_url`, `brand_domains` primário ou domínio publicado, nessa ordem.
- Monta a URL final: `{origin}/ofertas`.
- Exibe:
  - Campo `Input` readOnly com a URL.
  - Botão **Copiar** (clipboard + toast).
  - Botão **Abrir** (`window.open` em nova aba).
  - Botão **Compartilhar** (usa `navigator.share` quando disponível, com fallback para copiar).
- Texto auxiliar curto: "Use este link para divulgar a vitrine pública. Funciona sem login."

### 2. Componente novo `link_publico_ofertas.tsx`
Seguindo a regra de feature-based + componentização, criar:

```text
src/features/ubiz_ofertas/components/
  link_publico_ofertas.tsx     ← novo componente (UI do bloco de link)
src/features/ubiz_ofertas/hooks/
  hook_link_publico_ofertas.ts ← novo hook (resolve URL via getPublicOrigin)
```

O `BrandThemeEditor.tsx` apenas importa e usa `<LinkPublicoOfertas brandId={...} />`, mantendo o editor enxuto.

### 3. Mini "como configurar" inline
Dentro do mesmo card, um pequeno bloco colapsável (`<details>` estilizado ou texto curto) com os 4 passos acima, em PT-BR, para o admin não precisar consultar documentação externa.

## Detalhes técnicos
- O `BrandThemeEditor` recebe a marca atual via contexto/props; obter `brandId` de `useBrand()` (`src/contexts/BrandContext.tsx`).
- Reutilizar `getPublicOrigin` de `src/lib/publicShareUrl.ts` (não duplicar lógica de resolução de domínio).
- Toast via `@/hooks/use-toast` (já usado no projeto).
- Sem novas dependências, sem migrações de banco.

## Fora do escopo
- Mudar a fonte de dados das ofertas (continua `affiliate_deals`, igual aos Achadinhos).
- Criar QR code da URL (pode ser feito depois, se solicitado).
- Mover o toggle para outro local do painel.

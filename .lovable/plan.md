

# Corrigir vazamento das sub-abas de Duelo dentro da Configuração do Campeonato

## Diagnóstico

As sub-abas mostradas nas screenshots (**Geral, Limites, Ciclo & Reset, Prêmios, Corridas**) pertencem 100% ao produto **Duelo Motorista** — todas falam de aposta, saldo de duelo, ranking, cinturão e campanhas de prêmio independentes da temporada. **Nenhuma faz sentido para o produto Campeonato**, que tem suas próprias configurações dentro da aba "Campeonato" (temporadas, séries, prêmios por classificação).

O componente `pagina_configuracoes_duelo.tsx` **já tem a guarda implementada**: quando `engagementFormat === "campeonato"`, ele oculta as 5 sub-abas e exibe um card explicativo "Modo Campeonato ativo". O problema é apenas que `GamificacaoAdminPage` chama o componente **sem passar o prop `engagementFormat`** — então a guarda nunca dispara e tudo vaza para a tela.

## O que vou fazer

**1 arquivo, 1 linha de mudança real.**

### `src/pages/GamificacaoAdminPage.tsx`

Já existe a constante `formato` vinda de `useFormatoEngajamento(currentBrandId)`. Basta propagá-la:

```tsx
const { isCampeonato, formato } = useFormatoEngajamento(currentBrandId);

// ...

<TabsContent value="configuracao">
  <PaginaConfiguracoesDuelo
    branchId={branch.id}
    brandId={branch.brand_id}
    settings={settings}
    engagementFormat={formato}   // ← propagar
  />
</TabsContent>
```

## Resultado esperado

Para a marca **Meu Mototáxi** (modo `campeonato`), a aba **Configuração** passa a mostrar **apenas** o card:

> **Modo Campeonato ativo** — Esta marca opera no formato Campeonato. As configurações de duelos 1v1, apostas paralelas, ranking e cinturão estão desativadas e ocultas. Toda a gestão competitiva acontece pela aba Campeonato.

As 5 sub-abas (Geral, Limites, Ciclo & Reset, Prêmios, Corridas) **somem completamente**, ficando disponíveis apenas para marcas em modo `duelo` / `mass_duel`. Nada muda para essas outras marcas.

## Risco e rollback

- **Risco zero**: passa um prop que o componente já espera; default perm
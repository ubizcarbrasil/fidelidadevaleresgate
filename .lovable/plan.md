

# Verificação do Manual "Produtos Comerciais" na Central de Manuais

## O que vou fazer

Abrir a página `/manuais` no preview, digitar "Produtos Comerciais" no campo de busca e confirmar visualmente que o manual aparece corretamente, expandindo-o para validar conteúdo (passos, dicas, botão "Ir para esta página").

## Passos da verificação

1. Navegar até `/manuais` no preview do app (viewport mobile 430×761, conforme o usuário está vendo agora)
2. Localizar o campo de busca "Buscar manual por nome ou descrição..."
3. Digitar `Produtos Comerciais`
4. Capturar screenshot do resultado filtrado
5. Expandir o card do manual encontrado
6. Capturar screenshot do conteúdo expandido (O que é, Como ativar, Passo a passo, Dicas, botão Ir para esta página)
7. Reportar o resultado: se aparece, em qual grupo (esperado: "Configurações Avançadas"), se o conteúdo está completo e se o botão de navegação está presente

## O que será reportado ao final

- ✅/⚠️ Manual aparece na busca
- Grupo/categoria onde está alojado
- Quantidade de seções renderizadas (esperado: 4 — O que é, Como ativar, Passo a passo, Dicas)
- Funcionamento do filtro (resultado único ou múltiplos)
- Eventuais problemas visuais no mobile (430px) — overflow, texto cortado, botão escondido

## Pré-requisito

A rota `/manuais` exige usuário autenticado. Se o preview cair na tela de login, vou parar e avisar para você logar antes de eu continuar.

## Sem mudanças de código

Esta é uma verificação somente leitura. Nenhum arquivo será editado. Caso encontre algum bug visual ou de filtragem, eu paro e abro um plano de correção separado.


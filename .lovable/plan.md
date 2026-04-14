
Diagnóstico rápido:

O bloco destacado da imagem é do ecossistema de Achadinhos do motorista:
- banner amarelo
- categoria “Novas Ofertas”
- cards de ofertas

Ele não é controlado pelo “Módulo Mercado Livre”.

No código atual, esse trecho depende de 2 chaves ao mesmo tempo:
1. Marca: módulo `affiliate_deals` (“Achadinhos” em Funcionalidades do App/Marca)
2. Cidade: `branch_settings_json.enable_achadinhos_module` (“Módulo Achadinho” dentro da edição da cidade)

Qual desativar para isso sumir:
- Para remover dessa cidade específica: desative `Módulo Achadinho` na tela de edição da cidade.
- Para remover da marca inteira: desative `Achadinhos` em Funcionalidades da Marca/App.
- Se quiser garantir que suma agora, deixe os dois desligados.

Importante:
- Não é o toggle “Módulo Mercado Livre”.
- “Módulo Mercado Livre” é outro fluxo, ligado ao resgate/marketplace de produtos, não a esse bloco de “Novas Ofertas”.

Resumo objetivo:
- O toggle certo da cidade é: `Módulo Achadinho`
- O toggle global da marca é: `Achadinhos`
- Desligando ambos, esse bloco deve desaparecer

Se ainda continuar mesmo com os dois desligados, o cenário mais provável não é configuração e sim cache antigo do app do motorista/PWA. Nesse caso, a próxima correção seria revisar cache/atualização do front para garantir que a desativação reflita imediatamente.

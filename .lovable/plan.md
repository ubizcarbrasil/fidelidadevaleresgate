

# Investigação: "Agendado" ainda aparece na seção errada

## Diagnóstico

O código do `DuelsHub.tsx` já foi corrigido na última alteração — a seção "Ao vivo na cidade" filtra apenas `status === "live"`. Porém, existem **duas possíveis causas** para o problema persistir:

1. **FeedAtividadeCidade** — A seção "Atividade da Cidade" no final da tela mostra **todos** os duelos da cidade (incluindo `accepted`/agendados) com badges como "Desafio aceito", o que pode estar causando confusão visual similar.

2. **Cache do preview** — A versão anterior do código pode ainda estar carregada no navegador. Um refresh forçado resolveria.

## Plano de correção

### 1. Verificar se é cache
- Testar se o preview atual já reflete o código corrigido (a seção "Ao vivo" deveria mostrar apenas duelos `live`)

### 2. Melhorar o FeedAtividadeCidade
- Se o problema é no feed, filtrar ou agrupar melhor os itens para evitar confusão com as seções acima
- Excluir do feed os duelos que já aparecem nas seções "Ao vivo" e "Agendados" para não duplicar

### 3. Arquivo alterado
- `src/components/driver/duels/DuelsHub.tsx` — ajustar o array `feedAtividade` para excluir duelos já listados nas seções de destaque (ao vivo e agendados)

## Pergunta
Preciso confirmar: o problema que você vê é na seção "Ao vivo na cidade" ainda mostrando badge "Agendado"? Ou é em outra parte da tela (como o feed de atividade mais abaixo)? Se puder mandar outro print ajuda a localizar exatamente.


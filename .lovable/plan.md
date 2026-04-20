

# Remover o aviso desnecessário e auto-corrigir silenciosamente

## Você tem razão

Faz sentido: quem contratou o **Engajamento Motorista Premium** sabe que é só motorista. Mostrar um alerta vermelho dizendo "ó, sua cidade está incompatível, clique para ajustar" é:

1. **Burocrático** — obriga o usuário a clicar em algo que ele nem precisava saber que existia
2. **Assustador** — cor vermelha + palavra "incompatível" passa sensação de erro/problema, quando na verdade é só um resíduo de configuração antiga
3. **Redundante** — o `handleSave` já normaliza automaticamente no momento de salvar, então o sistema já se auto-corrige sozinho

O aviso só fazia sentido enquanto eu não confiava na normalização automática. Mas ela já existe e funciona. Então o aviso é ruído.

## O que vou fazer

### 1. Remover o bloco de alerta vermelho
Arquivo: `src/pages/BrandBranchForm.tsx` (linhas ~545–568, o bloco `<Alert variant="destructive">` com "Modelo de pontuação incompatível")

Remover por completo. Sem substituto, sem aviso amarelo, sem nada.

### 2. Normalizar silenciosamente no carregamento
No `useEffect` que popula o form a partir dos dados da branch, aplicar `normalizarScoringModel(...)` antes de setar o estado local `scoringModel`. Assim, ao abrir a cidade Olímpia:
- Se ela está como `BOTH` mas o plano só permite `DRIVER_ONLY`, o select já abre mostrando "Pontuar apenas Motorista"
- O usuário nem percebe que existia uma configuração legada
- Quando ele salvar (por qualquer motivo), o valor correto já vai pro banco

### 3. Manter a defesa no `handleSave`
A normalização no save continua existindo como rede de segurança. Não mexo nela.

### 4. Manter o banner do topo
O chip discreto "🎯 Plano: Engajamento Motorista Premium — apenas funcionalidades incluídas estão visíveis" continua, porque ele é informativo (não é alerta de erro) e ajuda o usuário a entender por que algumas opções não aparecem.

## O que NÃO vou mexer

- ❌ Lógica de `useProductScope`
- ❌ Filtros de UI por audiência (continuam escondendo o que não está no plano)
- ❌ Normalização defensiva no save
- ❌ Banco, RLS, edge functions
- ❌ Outras telas

## Resultado esperado

Ao abrir a cidade Olímpia (ou qualquer outra com configuração legada):
- Sem alerta vermelho
- Select de Modelo de Pontuação já mostra "Pontuar apenas Motorista" (ou a única opção compatível)
- Experiência limpa, como se a cidade sempre tivesse sido configurada corretamente

## Risco

Zero. Estou removendo ruído visual e movendo a correção para um momento mais discreto (carregamento). `npx tsc --noEmit` esperado limpo.

## Estimativa

~2 min.


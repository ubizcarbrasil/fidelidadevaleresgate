
Objetivo: corrigir 3 falhas reais de navegação/descoberta já existentes no fluxo do empreendedor, cidade e motorista.

1. Corrigir “Acessar Conta” do motorista
- Diagnóstico: o fluxo de pré-acesso do motorista hoje grava a sessão e abre `/driver` em nova aba (`window.open(..., "_blank")`). Em preview/mobile isso fica frágil e acaba caindo na tela de CPF.
- Implementação:
  - Ajustar `src/components/driver-management/tabs/AbaDadosMotorista.tsx` para redirecionar no mesmo contexto da aba/janela, preservando a sessão temporária.
  - Revisar e alinhar outros atalhos relacionados a abrir o painel do motorista, especialmente `src/components/dashboard/DashboardQuickLinks.tsx`, para sempre apontarem ao painel correto do motorista e não a rotas erradas.
- Resultado esperado: ao clicar em “Acessar Conta”, o painel do motorista abre direto logado no motorista selecionado.

2. Corrigir acesso ao painel/região da cidade no dashboard do empreendedor
- Diagnóstico: o card “Acesso ao Painel do Franqueado” usa `/index?branchId=...`, mas a app redireciona `/index` para `/` e a query pode se perder; por isso o dashboard continua na visão agregada.
- Implementação:
  - Ajustar `src/components/dashboard/DemoAccessCard.tsx` para navegar usando a rota real com `branchId` preservado.
  - Auditar links equivalentes que ainda usem `/index` para visão de cidade.
- Resultado esperado: ao clicar em “Abrir” na cidade, o dashboard entra na visão regional daquela cidade, não permanece no consolidado da marca.

3. Tornar apostas realmente encontráveis para motoristas
- Diagnóstico: a aposta existe tecnicamente dentro da `ArenaAoVivo`, mas está escondida demais; além disso, o card público comunica apenas “Assistir ao vivo”, então o usuário não entende que ali também pode apostar. Há também um gap para duelos agendados, já que a arena suporta aposta em `accepted`, mas o card público não abre essa arena.
- Implementação:
  - Em `src/components/driver/duels/CardDueloPublico.tsx`, trocar a CTA visual para algo como “Assistir e apostar” e permitir abrir a arena também quando o duelo estiver agendado, se a aposta já estiver liberada.
  - Em `src/components/driver/duels/DuelsHub.tsx`, reforçar o texto da seção pública deixando claro que é dali que o motorista assiste, palpita e aposta.
  - Em `src/components/driver/duels/ArenaAoVivo.tsx` e/ou `src/components/driver/duels/ApostasDuelo.tsx`, subir a entrada de aposta para mais perto do topo, com CTA explícita, para não depender de scroll.
- Resultado esperado: qualquer espectador motorista consegue identificar facilmente onde entrar para apostar em duelo ao vivo (e, se aplicável, também no agendado).

Arquivos principais
- `src/components/driver-management/tabs/AbaDadosMotorista.tsx`
- `src/components/dashboard/DashboardQuickLinks.tsx`
- `src/components/dashboard/DemoAccessCard.tsx`
- `src/components/driver/duels/CardDueloPublico.tsx`
- `src/components/driver/duels/DuelsHub.tsx`
- `src/components/driver/duels/ArenaAoVivo.tsx`
- `src/components/driver/duels/ApostasDuelo.tsx`

Validação após implementar
- Empreendedor > motorista > “Acessar Conta” abre direto no painel do motorista, sem pedir CPF.
- Empreendedor > card da cidade > “Abrir” entra na visão daquela cidade.
- Motorista espectador consegue localizar claramente um CTA de aposta, abrir o duelo e criar/aceitar aposta sem ficar escondido.

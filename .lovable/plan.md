`.

---

# Como configurar o Campeonato

Tudo é feito no **Painel do Empreendedor → Campeonato Motorista**. O fluxo tem **3 camadas** que precisam estar OK na ordem:

## 1. Liberação (Root Admin)
Antes de tudo, na **Central de Módulos → Empreendedores**, abra o card do modelo **Duelo Motorista** da marca e no bloco **"Formatos disponíveis"** deixe **Campeonato** ligado. Sem isso, o card no painel do empreendedor aparece com cadeado 🔒.

## 2. Ativar e escolher o formato
Na tela do campeonato:
1. **Card "Ativar Campeonato"** — clica para ligar o módulo na marca.
2. **Seletor "Formato de engajamento"** — escolhe **Campeonato** (alternativa a *Duelo 1v1* e *Desafio em Massa*). Se houver temporada ativa rolando, o sistema bloqueia a troca.

## 3. Criar a temporada (botão **+ Nova / Criar temporada**)
O modal abre em 4 passos:

### Passo A — Template
Escolhe um dos 3 pré-prontos (depois pode editar tudo):
- **Simples** — 2 séries (A, B), 16 motoristas cada
- **Padrão** — 3 séries (A, B, C) ⭐ recomendado
- **Completo** — 5 séries (A a E), operações grandes

### Passo B — Informações básicas
- **Nome** da temporada (ex: "Brasileirão Janeiro/2026")
- **Mês** e **Ano**
- **Fase 1 — Classificação**: data de início e fim (pontos corridos)
- **Fase 2 — Mata-mata**: data de início e fim (precisa começar **depois** do fim da classificação)

### Passo C — Séries (hierarquia A, B, C…)
Para cada série configure:
- **Nome** (A, B, C…) — só letras/números, máx 10 caracteres
- **Tamanho** — quantos motoristas cabem (2 a 64)
- **Sobem** — quantos da série vão para a divisão de cima no fim
- **Descem** — quantos vão para a divisão de baixo

Regras:
- Mínimo 2 séries, máximo 8
- A **primeira série (A)** não tem promoção (já é a mais alta)
- A **última série** não tem rebaixamento
- *Sobem + Descem* não pode passar do **Tamanho**

### Passo D — Prêmios em pontos
Para **cada série**, define quantos pontos o motorista ganha por posição final no mata-mata:
- 🥇 Campeão
- 🥈 Vice-campeão
- Semifinalista
- Quartas
- Oitavas

Os pontos são creditados automaticamente no encerramento da temporada.

### Revisão e criação
Última tela mostra resumo de tudo. Confirmar cria a temporada — o sistema faz o **seeding inicial** das séries (distribui motoristas) automaticamente.

## Depois de criada — operação contínua

Na tela principal aparecem:
- **Card da temporada ativa** com fase atual (Classificação / Mata-mata / Encerrada)
- **Ações da temporada**: Pausar, Cancelar, Incluir motorista manualmente
- **Cards por série**: ranking ao vivo, pode abrir cada uma para ver tabela completa e o chaveamento
- **Prêmios a distribuir**: aparece quando a temporada termina, para você confirmar a distribuição
- **Histórico**: lista de temporadas anteriores

## Quer que eu te leve direto na tela?
Me diz qual marca você está testando e eu posso:
1. Verificar se o **Campeonato está liberado pelo Root** para essa marca
2. Confirmar se já existe uma **temporada criada** ou se precisa criar a primeira
3. Te mostrar exatamente onde clicar com base no estado atual

Se preferir, também posso ajustar **textos de ajuda dentro do próprio modal** (tooltips em cada campo) para ficar autoexplicativo no produto — é só pedir.Esse `plan--create` foi engano — vou só responder como mensagem normal.

---

# Como configurar o Campeonato

Tudo é feito no **Painel do Empreendedor → Campeonato Motorista**. O fluxo tem **3 camadas** que precisam estar OK na ordem:

## 1. Liberação (Root Admin)
Antes de tudo, na **Central de Módulos → Empreendedores**, abre o card do modelo **Duelo Motorista** da marca e no bloco **"Formatos disponíveis"** deixa **Campeonato** ligado. Sem isso, o card no painel do empreendedor aparece com cadeado 🔒.

## 2. Ativar e escolher o formato
Na tela do campeonato:
1. **Card "Ativar Campeonato"** — clica para ligar o módulo na marca.
2. **Seletor "Formato de engajamento"** — escolhe **Campeonato** (alternativa a *Duelo 1v1* e *Desafio em Massa*). Se já houver temporada ativa rolando, o sistema bloqueia a troca.

## 3. Criar a temporada (botão **+ Criar temporada / Nova**)
O modal abre em 4 passos:

### Passo A — Template
Escolhe um dos 3 pré-prontos (depois pode editar tudo):
- **Simples** — 2 séries (A, B), 16 motoristas cada
- **Padrão** — 3 séries (A, B, C) ⭐ recomendado
- **Completo** — 5 séries (A a E), operações grandes

### Passo B — Informações básicas
- **Nome** da temporada (ex: "Brasileirão Janeiro/2026")
- **Mês** e **Ano**
- **Fase 1 — Classificação**: data de início e fim (pontos corridos)
- **Fase 2 — Mata-mata**: data de início e fim (precisa começar **depois** do fim da classificação)

### Passo C — Séries (hierarquia A, B, C…)
Para cada série configure:
- **Nome** (A, B, C…) — só letras/números, máx 10 caracteres
- **Tamanho** — quantos motoristas cabem (2 a 64)
- **Sobem** — quantos vão para a divisão de cima no fim
- **Descem** — quantos vão para a divisão de baixo

Regras:
- Mínimo 2 séries, máximo 8
- A **primeira série (A)** não tem promoção (já é a mais alta)
- A **última série** não tem rebaixamento
- *Sobem + Descem* não pode passar do **Tamanho**

### Passo D — Prêmios em pontos
Para **cada série**, define quantos pontos o motorista ganha por posição final no mata-mata:
- 🥇 Campeão
- 🥈 Vice-campeão
- Semifinalista
- Quartas
- Oitavas

Os pontos são creditados automaticamente no encerramento da temporada.

### Revisão e criação
A última tela mostra o resumo de tudo. Confirmar cria a temporada — o sistema faz o **seeding inicial** das séries (distribui motoristas) automaticamente.

## Depois de criada — operação contínua

Na tela principal aparecem:
- **Card da temporada ativa** com fase atual (Classificação / Mata-mata / Encerrada)
- **Ações da temporada**: Pausar, Cancelar, Incluir motorista manualmente
- **Cards por série**: ranking ao vivo; pode abrir cada uma pra ver tabela completa e o chaveamento
- **Prêmios a distribuir**: aparece quando a temporada termina, para você confirmar a distribuição
- **Histórico**: lista de temporadas anteriores

---

Quer que eu **adicione tooltips de ajuda dentro do próprio modal** (uma frase explicando cada campo) pra ficar autoexplicativo no produto? Se sim, eu monto o plano e a gente já implementa.


## Etapa — Manual de Instruções e Ajuda Contextual do Módulo de Duelos

### Resumo
Adicionar conteúdo de manual completo para o módulo de Duelos (motoristas e administradores) na Central de Manuais existente, além de ajuda contextual nas telas do módulo via ContextualHelpDrawer e tooltips inline "Como funciona?".

---

### 1. Manual completo na Central de Manuais

**Arquivo modificado: `src/components/manuais/dados_manuais.ts`**

Adicionar dois novos grupos:

**Grupo para franqueado** (dentro de `gruposManuaisFranqueado`, com `scoringFilter: "DRIVER"`):
- Categoria: "Gamificação — Duelos entre Motoristas"
- Icone: "Swords"
- Manuais:
  1. **Ativação do Módulo** — como ativar duelos, ranking e cinturão na configuração
  2. **Gerenciando Duelos** — visualizar duelos ativos, filtrar por status, monitorar corridas
  3. **Ranking da Cidade** — como funciona o ranking mensal, como resetar
  4. **Cinturão da Cidade** — como funciona, atualização, campeão atual
  5. **Moderação de Apelidos** — como editar apelidos públicos dos motoristas
  6. **Configurações Avançadas** — duração, limites, frases de recusa, métricas

**Grupo para empreendedor** (dentro de `gruposManuais`):
- Categoria: "Gamificação — Administração"
- Icone: "Swords"
- Manuais similares ao do franqueado (visão BRAND vê tudo)

Cada manual seguirá o formato existente: `id`, `titulo`, `descricao`, `comoAtivar`, `passos[]`, `dicas[]`, `rota`.

---

### 2. Ajuda contextual nas rotas do módulo

**Arquivo modificado: `src/lib/helpContent.ts`**

Adicionar entradas para:

- **`/gamificacao-admin`** — Help para a página administrativa com seções: Configuração, Duelos, Ranking, Cinturão, Moderação
- Seções cobrindo: ativação, criação de desafios, contagem de corridas, acompanhamento ao vivo, regras de privacidade, dúvidas frequentes

Isso faz o botão flutuante de ajuda (ContextualHelpDrawer) aparecer automaticamente na rota `/gamificacao-admin`.

---

### 3. Ajuda contextual na tela do motorista (DuelsHub)

**Novo componente: `src/components/driver/duels/AjudaDuelosSheet.tsx`**

Sheet/drawer mobile-friendly com manual do motorista organizado em accordion:
- Como funciona o duelo
- Como desafiar alguém
- Aceitar ou recusar desafio
- Como são contadas as corridas
- Acompanhamento ao vivo
- Ranking da cidade
- Cinturão da cidade
- Privacidade e anonimato
- Dúvidas frequentes (FAQ)

**Arquivo modificado: `src/components/driver/duels/DuelsHub.tsx`**

Adicionar botão "Como funciona?" no header (ícone HelpCircle) que abre o `AjudaDuelosSheet`.

---

### 4. Tooltips inline nas telas

**Arquivo modificado: `src/components/driver/duels/DuelsHub.tsx`**

Adicionar tooltips sutis nos elementos principais:
- Toggle "Participar dos Duelos" — tooltip explicando o que acontece ao ativar
- Botão "Desafiar" — tooltip "Escolha um adversário e defina o período"

**Arquivo modificado: `src/components/admin/gamificacao/ConfiguracaoModulo.tsx`**

Adicionar ícones de ajuda (HelpCircle) ao lado dos toggles e campos com tooltips explicativos curtos.

---

### 5. Registro do ícone Swords no ManuaisPage

**Arquivo modificado: `src/pages/ManuaisPage.tsx`**

Adicionar `Swords` ao mapa `iconesPorNome` para que o novo grupo renderize corretamente.

---

### Arquivos envolvidos
```
src/components/manuais/dados_manuais.ts (modificado — novos grupos de manuais)
src/lib/helpContent.ts (modificado — ajuda contextual /gamificacao-admin)
src/components/driver/duels/AjudaDuelosSheet.tsx (novo — manual do motorista)
src/components/driver/duels/DuelsHub.tsx (modificado — botão "Como funciona?" + tooltips)
src/components/admin/gamificacao/ConfiguracaoModulo.tsx (modificado — tooltips inline)
src/pages/ManuaisPage.tsx (modificado — ícone Swords)
```


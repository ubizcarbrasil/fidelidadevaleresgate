

# Processo de configuração do Campeonato Duelo

## Diagnóstico

Hoje o módulo tem **3 chaves** que precisam estar ligadas. Apenas 1 tem UI:

| # | Chave | Onde mora | Tem UI? | Estado atual |
|---|---|---|---|---|
| 1 | `USE_DUELO_CAMPEONATO` | `src/compartilhados/constants/constantes_features.ts` | ❌ Código | `false` |
| 2 | `brand_settings_json.duelo_campeonato_enabled` | tabela `brands` | ❌ Só banco | `null` |
| 3 | `brand_business_models.engagement_format` | tabela `brand_business_models` | ✅ Aba Campeonato (seletor) | `duelo` |

**Resultado**: o empreendedor abre `/gamificacao` → aba **Campeonato** e vê só o seletor de formato. Mesmo trocando para "Campeonato", nada funciona porque as camadas 1 e 2 estão OFF.

## Onde configurar HOJE (caminho manual)

**Console do empreendedor:**
1. Acessar **Gamificação** (sidebar) → escolher cidade → aba **Campeonato**
2. No seletor superior, trocar formato para **Campeonato**

Mas isso **não funciona em produção** sem antes ligar as camadas 1 e 2 (que exigem alteração de código + migration). É o gargalo que vamos resolver.

## Proposta de processo correto (3 commits)

### Commit 1 — Ligar a flag global (1 linha)

`src/compartilhados/constants/constantes_features.ts`:
```ts
export const USE_DUELO_CAMPEONATO = true;  // era false
```

Justificativa: Bloco C inteiro (C.1–C.5) está concluído, validado e em produção. A flag de código existia para rollback rápido durante rollout — agora pode ser ligada por padrão. Mantém-se desligada por marca (camada 2) para controle gradual.

### Commit 2 — Criar UI de ativação por marca (camada 2)

**Local certo**: na aba **Campeonato** do `/gamificacao`, **antes** do `SeletorFormatoEngajamento`, adicionar um **card de ativação** que persiste `brand_settings_json.duelo_campeonato_enabled`.

**Novo componente**: `src/features/campeonato_duelo/components/empreendedor/CardAtivarCampeonato.tsx`

```text
┌─────────────────────────────────────────────────┐
│  🏆  Campeonato Duelo Motorista                  │
│                                                  │
│  Sistema de temporadas mensais com séries       │
│  hierárquicas (A, B, C…), classificação,        │
│  mata-mata, hall da fama público e prêmios.     │
│                                                  │
│  Status: ⚪ Desativado para esta marca          │
│                                                  │
│  [ Ativar Campeonato ]                          │
└─────────────────────────────────────────────────┘
```

Quando ativado, o card colapsa e mostra apenas:
```text
🏆 Campeonato ativo • [Desativar]
```

**Comportamento**:
- Toggle escreve em `brands.brand_settings_json` via update padrão (com `.select()` por causa do Supabase Update Hardening)
- Invalidação cruzada de `useDueloCampeonatoHabilitado`, `useFormatoEngajamento`, `useDashboardCampeonato`
- Audit log em `duelo_attempts_log` (code: `brand_campeonato_toggled`)
- Confirmação via `AlertDialog` ao desativar (avisa que pausa temporadas em curso, sem cancelá-las)

**Renderização condicional** em `pagina_campeonato_empreendedor.tsx`:
- Se `!campeonatoHabilitado` → mostra **só** o `CardAtivarCampeonato`
- Se `campeonatoHabilitado && !isCampeonato` → mostra `CardAtivarCampeonato` (modo compacto) + `SeletorFormatoEngajamento` + card "Selecione formato Campeonato"
- Se `campeonatoHabilitado && isCampeonato` → fluxo atual (seletor + dashboard)

### Commit 3 — Documentar o processo (Manual + Memory)

**3.1** Adicionar entrada na **Central de Módulos → Manual** (`src/features/central_modulos/components/aba_manual.tsx`):
> **Como ativar o Campeonato Duelo Motorista**  
> Passo 1: Console do empreendedor → Gamificação → cidade → aba Campeonato  
> Passo 2: Clicar em "Ativar Campeonato" no card de ativação  
> Passo 3: No seletor de formato, escolher "Campeonato"  
> Passo 4: Clicar em "Criar temporada" e preencher o formulário (template Padrão recomendado)

**3.2** Atualizar memória `mem://modules/gamification/comprehensive-governance` com a nova UI de ativação.

## Arquivos impactados

**Editados:**
- `src/compartilhados/constants/constantes_features.ts` (1 linha)
- `src/features/campeonato_duelo/pagina_campeonato_empreendedor.tsx` (renderização condicional)
- `src/features/central_modulos/components/aba_manual.tsx` (adiciona seção)

**Criados:**
- `src/features/campeonato_duelo/components/empreendedor/CardAtivarCampeonato.tsx`
- `src/features/campeonato_duelo/hooks/hook_ativar_campeonato.ts` (mutation toggle)
- `src/features/campeonato_duelo/services/servico_ativar_campeonato.ts` (update em `brands`)

**Sem migration**: usa coluna `brand_settings_json` já existente. Sem nova RPC: update direto na tabela `brands` já tem RLS para `brand_admin`.

## Fluxo final do empreendedor (depois dos 3 commits)

```text
1. Sidebar → Gamificação
2. Selecionar cidade
3. Aba "Campeonato"
4. [ Ativar Campeonato ]  ← NOVO botão claro
5. Seletor: trocar para "Campeonato"
6. [ + Criar temporada ]  ← já existe, abre Accordion 4 seções
7. Pronto — cron horário começa a operar
```

## Riscos & rollback

- **Commit 1** (flag global): rollback = trocar de volta para `false` e redeploy. Zero impacto em dados.
- **Commit 2** (UI de toggle): toggle nunca apaga dados. Desativar só esconde a UI; temporadas em curso ficam intactas no banco e podem ser retomadas ao reativar.
- **Commit 3** (docs): cosmético.

## Aprovação

Confirmar se posso executar os 3 commits sequencialmente, ou se prefere:
- **(a)** Apenas Commit 1 + Commit 2 agora; manual em commit separado depois
- **(b)** Os 3 commits de uma vez
- **(c)** Apenas o Commit 2 (UI), mantendo flag global em `false` para rollout controlado por código


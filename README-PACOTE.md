# Branch temporária — Pacote para `projeto-piloto`

⚠️ **Esta branch NÃO faz parte do `fidelidadevaleresgate`.**

Foi criada apenas como mecanismo de transferência: contém o pacote completo do módulo Campeonato extraído pra ser aplicado no repo `ubizcarbrasil/projeto-piloto`.

## Como usar (a partir da sessão Claude no `projeto-piloto`):

```bash
# 1. Clonar APENAS esta branch (rasa, pra ser rápido)
git clone --branch pacote-projeto-piloto --depth 1 \
  https://github.com/ubizcarbrasil/fidelidadevaleresgate.git /tmp/pacote

# 2. Copiar tudo do pacote pra raiz do projeto-piloto
cp -r /tmp/pacote/projeto-piloto-pacote/* /tmp/pacote/projeto-piloto-pacote/.* . 2>/dev/null || true

# 3. Limpar
rm -rf /tmp/pacote

# 4. Ler instruções
cat LEIA-PRIMEIRO.md
```

Se o repo `fidelidadevaleresgate` for **privado**, precisa de PAT (Personal Access Token) com escopo `repo`:

```bash
git clone --branch pacote-projeto-piloto --depth 1 \
  https://<USUARIO>:<PAT>@github.com/ubizcarbrasil/fidelidadevaleresgate.git /tmp/pacote
```

## O que tem dentro de `projeto-piloto-pacote/`

- `LEIA-PRIMEIRO.md` — passo a passo de aplicação
- `PLANO-EXTRACAO-CAMPEONATO.md` — arquitetura completa
- `src/features/campeonato/` — módulo completo (183 arquivos)
- `src/contexts/`, `src/components/driver/`, `src/compartilhados/`, `src/hooks/`, `src/lib/`, `src/integrations/supabase/` — dependências externas
- `src/tema-campeonato.css` — visual Brasileirão
- `supabase/functions/` — 4 edge functions (machine-webhook, driver-upload-photo, duelo-cron-advance, duelo-cron-reconcile)
- `supabase/migrations-referencia/` — 110 migrations históricas (NÃO rodar em sequência, usar como referência)
- `vite.config.ts`, `index.html` — configs com fixes dos PRs #14/#15/#16

Depois de copiar e aplicar, essa branch pode ser deletada do `fidelidadevaleresgate`.

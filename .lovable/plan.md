

## Plano: Expandir Fase 4 da Jornada ROOT — "Configurar Módulos e Permissões"

### O que é a Fase 4 atualmente
Apenas 4 passos genéricos e 2 dicas sobre módulos e permissões. Falta detalhar o fluxo real das 3 páginas envolvidas e como elas se conectam.

### Alteração

**Arquivo:** `src/pages/RootJourneyGuidePage.tsx` — Fase 4 (linhas 97-115)

Expandir `steps` e `tips` para cobrir:

**Novos passos (7):**
1. Acesse → Plataforma → Funcionalidades para cadastrar ou editar módulos globais (ex: Ofertas, Pontos, Catálogo).
2. Módulos marcados como "Core" ficam sempre ativos e não podem ser desativados por marca.
3. Acesse → Usuários & Permissões → Módulos da Marca para ativar/desativar módulos específicos por marca.
4. Selecione a marca desejada e ligue/desligue cada módulo conforme o plano contratado.
5. Acesse → Usuários & Permissões → Permissões por Empresa para controlar ações granulares.
6. Defina o que parceiros de cada marca podem fazer: criar ofertas, emitir pontos, editar perfil, etc.
7. Revise as permissões sempre que adicionar novos módulos ou parceiros.

**Novas dicas (4):**
- Módulos desativados escondem automaticamente os menus correspondentes no painel do empreendedor e dos parceiros.
- O transbordo de permissões permite definir regras por nível hierárquico (Marca → Parceiro).
- Módulos "Core" garantem que funcionalidades essenciais nunca sejam desligadas acidentalmente.
- Configure permissões antes de aprovar parceiros para garantir que o acesso esteja correto desde o início.


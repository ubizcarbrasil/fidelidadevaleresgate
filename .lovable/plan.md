## Resumo

Hoje a plataforma tem só **2 origens fixas e codificadas** no sistema (`Divulga Link` e `Divulgador Inteligente`), e cada marca consegue salvar apenas **1 URL por origem** (tabela `mirror_sync_config` com unique em `brand_id + source_type`).

Você quer:
1. **Cadastrar várias URLs do mesmo tipo** (ex: 3 grupos diferentes do Divulga Link rodando em paralelo).
2. **Dois níveis de gestão**:
   - **Root Admin (plataforma)**: define o catálogo de origens disponíveis (ligar/desligar quais aparecem no sistema, editar nomes, ícones).
   - **Empreendedor (marca)**: dentro das origens disponíveis, ativa as que usa e cadastra quantas URLs/grupos quiser.

---

## O que será construído

### 1. Catálogo de Origens (Root Admin)

Nova página em `/admin-origens` (Root Admin only):

- Lista as origens da plataforma: hoje `Divulga Link` e `Divulgador Inteligente`.
- Para cada origem, controla:
  - Ativa/inativa globalmente (esconde do menu de todas as marcas se desligar).
  - Nome de exibição editável (ex: trocar "Divulgador Inteligente" por outro rótulo).
  - Ícone/cor para o sidebar.
  - Tipo de scraper que ela usa internamente (read-only — vinculado ao código do `mirror-sync`).
- Botão **"Solicitar nova origem"** abre apenas um aviso explicando que adicionar um site totalmente novo (ex: Awin, Lomadee) exige programação de um scraper específico no backend — isso é um pedido pra equipe técnica, não cadastro pela tela.

### 2. Múltiplas URLs por origem (Empreendedor)

Refatorar a página atual **`/mirror-sync` (Espelhamento de Ofertas)**:

- Hoje cada origem aceita 1 URL → vai aceitar **N URLs**, cada uma com nome próprio (ex: "Grupo Promoções Achadinhos", "Grupo Eletrônicos").
- Cada URL vira um "conector" independente:
  - URL da origem.
  - Apelido/nome interno.
  - Ativo/inativo.
  - Configurações próprias (intervalo de sync, máx. páginas, auto-ativar, auto-visível motorista, sub-páginas para scrape).
  - Indicador da última sincronização e quantidade de ofertas importadas.
- Lista em cards com:
  - Botão **"Sincronizar agora"** por conector.
  - Botão **"Editar"** abre modal com configs.
  - Botão **"Pausar/Ativar"**.
  - Botão **"Remover"** (com confirmação — remove o conector e arquiva as ofertas vinculadas).
- Botão grande **"+ Adicionar URL de [Divulga Link / Divulgador Inteligente]"** acima da lista.

### 3. Governança de Ofertas (já existe em `/offer-governance`)

Mantida como está, mas:
- O seletor de origem no topo (que hoje mostra `Divulga Link / Divulgador Inteligente`) agora respeita o catálogo do Root Admin (esconde origens desativadas globalmente).
- Os filtros por "Grupo" no submenu **Grupos** já funcionam por `source_group_id` — só recebem mais grupos automaticamente quando você cadastrar novas URLs.

---

## Mudanças técnicas (resumo)

**Banco de dados (migração)**
- Nova tabela `mirror_source_catalog` (catálogo global gerido pelo Root):
  - `id`, `source_key` (unique: `dvlinks` / `divulgador_inteligente`), `display_name`, `icon`, `is_enabled`, `scraper_handler` (read-only).
- Refatorar `mirror_sync_config`:
  - Remover constraint unique de `(brand_id, source_type)`.
  - Adicionar colunas `label` (apelido) e `is_enabled`.
  - Permitir múltiplas linhas por `(brand_id, source_type)`.
- Migration de dados: preserva os configs existentes com `label = "Conector principal"`.

**Backend (Edge Function `mirror-sync`)**
- Aceita `config_id` opcional no body para sincronizar um conector específico (não a marca inteira).
- Loop interno percorre todos os configs ativos quando `config_id` não vier.
- Cron de auto-sync passa a iterar por todos os conectores ativos da marca.

**Frontend**
- Nova página `src/features/admin_origens/pagina_admin_origens.tsx` (Root Admin).
- Refatorar `src/pages/MirrorSyncPage.tsx` para listar/criar/editar conectores em vez de uma config única.
- Componentes novos:
  - `card_conector_origem.tsx`
  - `modal_editar_conector.tsx`
  - `modal_adicionar_conector.tsx`
- `src/lib/api/mirrorSync.ts`: adicionar `listConnectors`, `createConnector`, `updateConnector`, `deleteConnector`.
- `OfferGovernancePage` filtra `ORIGENS` pelas que estiverem `is_enabled` no catálogo.

**Sidebar / rotas**
- Adicionar item "Origens da Plataforma" no grupo Root Admin → `/admin-origens`.
- Atualizar `MENU_REGISTRY` com a nova rota.

**Manuais**
- Atualizar `dados_manuais.ts` e `helpContent.ts` com a nova mecânica (múltiplas URLs + catálogo Root).

---

## O que NÃO está incluído

- Cadastrar sites totalmente novos pela tela (ex: Awin, Lomadee). Como cada site tem HTML próprio, exige programação de scraper na Edge Function — isso continua sendo um pedido sob demanda pra equipe técnica.
- Mudanças no fluxo de Achadinhos do cliente/motorista (a vitrine continua igual, só passa a receber ofertas de mais fontes).